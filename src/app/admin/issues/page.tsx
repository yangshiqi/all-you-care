import { createClient } from '@supabase/supabase-js';

interface Row {
  id: number;
  channel: string;
  lang: string;
  title: string;
  published_at: string;
  delivered: boolean;
  delivering_at: string | null;
  delivery_attempt_count: number;
  delivery_last_error: string | null;
}

async function loadRecent(): Promise<Row[]> {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await sb
    .from('issues')
    .select('id, channel, lang, title, published_at, delivered, delivering_at, delivery_attempt_count, delivery_last_error')
    .order('published_at', { ascending: false })
    .limit(30);
  if (error) throw new Error(error.message);
  return (data ?? []) as Row[];
}

export default async function AdminIssues() {
  const rows = await loadRecent();
  return (
    <main style={{ maxWidth: 1000, margin: '24px auto', padding: 16 }}>
      <h1>Recent issues</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr><th>ID</th><th>ch</th><th>lang</th><th>title</th><th>published</th><th>状态</th><th></th></tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
              <td>{r.id}</td>
              <td>{r.channel}</td>
              <td>{r.lang}</td>
              <td><a href={`/${r.lang === 'en' ? 'en' : 'zh-CN'}/issues/${r.id}`} target="_blank">{r.title.slice(0, 60)}</a></td>
              <td>{new Date(r.published_at).toLocaleString('zh-CN')}</td>
              <td>
                {r.delivered ? '✅ delivered' :
                 r.delivering_at ? '⏳ delivering' :
                 r.delivery_attempt_count > 0 ? `❌ ${r.delivery_last_error?.slice(0, 50)}` :
                 '🟡 pending'}
              </td>
              <td>
                {!r.delivered && (
                  <form action="/api/admin/deliver" method="post">
                    <input type="hidden" name="issue_id" value={r.id} />
                    <button type="submit">发送</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
