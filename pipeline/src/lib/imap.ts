import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import type { Logger } from './log.js';

export interface EmailItem {
  message_uid: number;
  message_id: string | null;       // RFC 822 Message-ID（external_id 候选）
  from: string;
  subject: string;
  text: string;
  html: string;
  date: Date;
}

export async function withImap<T>(
  log: Logger,
  fn: (client: ImapFlow) => Promise<T>,
): Promise<T> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error('GMAIL_USER / GMAIL_APP_PASSWORD not set');

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user, pass },
    // Pipe imapflow's protocol-level events into our structured logger so a
    // generic "Command failed" still surfaces the real cause (auth reject,
    // capability mismatch, socket reset etc).
    logger: {
      debug: () => { /* noisy — skip */ },
      info:  (obj) => log.debug({ event: 'imap_info',  ...(obj as object) }, ''),
      warn:  (obj) => log.warn({  event: 'imap_warn',  ...(obj as object) }, ''),
      error: (obj) => log.warn({  event: 'imap_error', ...(obj as object) }, ''),
    },
  });
  client.on('error', (err) => {
    log.warn({ event: 'imap_client_error', err: (err as Error)?.message ?? String(err), user, host: 'imap.gmail.com' }, '');
  });
  try {
    await client.connect();
  } catch (err) {
    log.warn({
      event: 'imap_connect_throw',
      user,
      host: 'imap.gmail.com',
      err: (err as Error)?.message ?? String(err),
      cause: (err as { cause?: unknown })?.cause ? String((err as { cause: unknown }).cause) : undefined,
      code: (err as { code?: string })?.code,
      response: (err as { response?: unknown })?.response ? String((err as { response: unknown }).response).slice(0, 500) : undefined,
    }, 'imap connect threw');
    throw err;
  }
  try {
    return await fn(client);
  } finally {
    await client.logout().catch(() => { /* ignore */ });
  }
}

export interface FetchOpts {
  mailbox?: string;       // default 'INBOX'
  onlyUnseen?: boolean;   // default true
}

export async function fetchUnreadFrom(
  client: ImapFlow,
  fromAddress: string,
  sinceDays: number,
  log: Logger,
  opts: FetchOpts = {},
): Promise<EmailItem[]> {
  const mailbox = opts.mailbox ?? 'INBOX';
  const onlyUnseen = opts.onlyUnseen ?? true;
  const lock = await client.getMailboxLock(mailbox);
  try {
    const since = new Date(Date.now() - sinceDays * 86_400_000);
    // CRITICAL: pass { uid: true } so search returns UIDs (not sequence numbers).
    // Without it, downstream markRead+UID STORE silently targets the wrong
    // message (UID and sequence are different — a search hit at seq 907 might
    // be UID 125044). This was the root cause of "messages stay unread despite
    // markRead reporting success".
    const uids = await client.search({
      from: fromAddress,
      since,
      ...(onlyUnseen ? { seen: false } : {}),
    }, { uid: true });
    const out: EmailItem[] = [];
    if (!uids) return out;
    for (const uid of uids) {
      const msg = await client.fetchOne(String(uid), { source: true, envelope: true }, { uid: true });
      if (!msg || !msg.source) continue;
      const parsed = await simpleParser(msg.source);
      out.push({
        message_uid: uid,
        message_id: parsed.messageId ?? null,
        from: fromAddress,
        subject: parsed.subject ?? '',
        text: parsed.text ?? '',
        html: typeof parsed.html === 'string' ? parsed.html : '',
        date: parsed.date ?? new Date(),
      });
    }
    log.debug({ event: 'imap_fetch', from: fromAddress, count: out.length }, 'imap ok');
    return out;
  } finally {
    lock.release();
  }
}

export async function markRead(
  client: ImapFlow,
  uid: number | number[],
  mailbox: string = 'INBOX',
): Promise<void> {
  const uids = Array.isArray(uid) ? uid : [uid];
  if (uids.length === 0) return;
  // Gmail UIDs are per-mailbox: a UID returned by an All-Mail search is a
  // different number than the same message's INBOX UID. The mailbox arg MUST
  // match wherever the UID came from, or `messageFlagsAdd` silently no-ops.
  // (\\Seen itself is shared across Gmail labels once set in any mailbox.)
  const lock = await client.getMailboxLock(mailbox);
  try {
    const range = uids.join(',');
    const ok = await client.messageFlagsAdd(range, ['\\Seen'], { uid: true });
    if (!ok) {
      // STORE returned false: server NO/BAD reply, or flags filtered against
      // permanentFlags. Re-fetch will retry on next tick — safe via DB unique
      // constraint on external_id.
      throw new Error(`messageFlagsAdd returned false (mailbox=${mailbox}, uids=${range})`);
    }
  } finally {
    lock.release();
  }
}
