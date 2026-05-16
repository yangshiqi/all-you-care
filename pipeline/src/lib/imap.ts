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
    logger: false,
  });
  await client.connect();
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
