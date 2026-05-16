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

export async function fetchUnreadFrom(
  client: ImapFlow,
  fromAddress: string,
  sinceDays: number,
  log: Logger,
): Promise<EmailItem[]> {
  const lock = await client.getMailboxLock('INBOX');
  try {
    const since = new Date(Date.now() - sinceDays * 86_400_000);
    const uids = await client.search({ from: fromAddress, since, seen: false });
    const out: EmailItem[] = [];
    if (!uids) return out;
    for (const uid of uids) {
      const msg = await client.fetchOne(uid, { source: true, envelope: true });
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

export async function markRead(client: ImapFlow, uid: number): Promise<void> {
  const lock = await client.getMailboxLock('INBOX');
  try {
    await client.messageFlagsAdd(uid, ['\\Seen'], { uid: true });
  } finally {
    lock.release();
  }
}
