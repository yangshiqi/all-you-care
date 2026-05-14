import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const DELIVER_URLS: Record<string, string> = {
  ai: 'https://www.snapallx.com/api/send-latest-ai-news?type=ai',
  snow: 'https://www.snapallx.com/api/send-latest-ai-news?type=snow',
};

export async function POST(req: Request) {
  let issueId: number | undefined;
  const ct = req.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    const body = await req.json().catch(() => ({}));
    issueId = Number(body.issue_id);
  } else {
    const fd = await req.formData();
    issueId = Number(fd.get('issue_id'));
  }
  if (!issueId || !Number.isFinite(issueId)) {
    return NextResponse.json({ error: 'issue_id required' }, { status: 400 });
  }

  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const sb = createClient(url, key, { auth: { persistSession: false } });

  // CLAIM: 5-min delivering_at lock
  const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
  const { data: claimed, error: claimErr } = await sb.from('issues')
    .update({ delivering_at: new Date().toISOString() } as never)
    .eq('id', issueId)
    .eq('delivered', false)
    .or(`delivering_at.is.null,delivering_at.lt.${fiveMinAgo}`)
    .select('*');
  if (claimErr) return NextResponse.json({ error: claimErr.message }, { status: 500 });
  const issue = (claimed as { id: number; channel: string; delivery_attempt_count: number }[] | null)?.[0];
  if (!issue) return NextResponse.json({ error: 'already delivered or being delivered' }, { status: 409 });

  const deliverUrl = DELIVER_URLS[issue.channel];
  if (!deliverUrl) {
    await sb.from('issues').update({ delivering_at: null } as never).eq('id', issue.id);
    return NextResponse.json({ error: `no deliver url for channel ${issue.channel}` }, { status: 500 });
  }

  try {
    const resp = await fetch(deliverUrl, { method: 'GET', signal: AbortSignal.timeout(30_000) });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${(await resp.text()).slice(0, 200)}`);
    await sb.from('issues').update({
      delivered: true,
      delivered_at: new Date().toISOString(),
      delivering_at: null,
    } as never).eq('id', issue.id);
    return NextResponse.json({ ok: true, issue_id: issue.id });
  } catch (e) {
    const msg = (e as Error).message;
    await sb.from('issues').update({
      delivering_at: null,
      delivery_attempt_count: (issue.delivery_attempt_count ?? 0) + 1,
      delivery_last_error: msg.slice(0, 1000),
    } as never).eq('id', issue.id);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
