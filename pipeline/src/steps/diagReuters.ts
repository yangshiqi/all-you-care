// pipeline/src/steps/diagReuters.ts
// One-off diagnostic: list ALL mail from Reuters (seen + unseen) across mailboxes.
import type { StepContext, StepResult } from '../cli.js';
import { ImapFlow } from 'imapflow';

const REUTERS_FROM = 'dailybriefing@thomsonreuters.com';
const SINCE_DAYS = 14;

export async function run(ctx: StepContext): Promise<StepResult> {
  const { log } = ctx;
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

  const since = new Date(Date.now() - SINCE_DAYS * 86_400_000);
  const mailboxes = ['INBOX', '[Gmail]/All Mail', '[Gmail]/Spam', '[Gmail]/Trash'];

  for (const mb of mailboxes) {
    try {
      const lock = await client.getMailboxLock(mb);
      try {
        const uids = (await client.search({ from: REUTERS_FROM, since })) || [];
        log.info({ event: 'diag_mailbox', mailbox: mb, total_match: uids.length }, '');
        for (const uid of uids.slice(-10)) {
          const msg = await client.fetchOne(uid, { envelope: true, flags: true, internalDate: true });
          if (!msg) continue;
          log.info({
            event: 'diag_mail',
            mailbox: mb,
            uid,
            date: msg.internalDate ? new Date(msg.internalDate).toISOString() : null,
            subject: msg.envelope?.subject ?? null,
            from: msg.envelope?.from?.[0]?.address ?? null,
            seen: msg.flags?.has('\\Seen') ?? null,
            flags: msg.flags ? Array.from(msg.flags) : [],
          }, '');
        }
      } finally {
        lock.release();
      }
    } catch (e) {
      log.warn({ event: 'diag_mailbox_fail', mailbox: mb, err: (e as Error).message }, '');
    }
  }

  await client.logout().catch(() => { /* ignore */ });
  return { processed: 0, skipped: 0, failed: 0, notes: 'diag-reuters' };
}
