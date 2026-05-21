// pipeline/src/steps/fetchEmail.ts
import type { StepContext, StepResult } from '../cli.js';
import { withImap, fetchUnreadFrom, markRead } from '../lib/imap.js';

export async function run(ctx: StepContext): Promise<StepResult> {
  const { channel, db, log } = ctx;
  let processed = 0, skipped = 0, failed = 0;

  try {
    await withImap(log, async client => {
    for (const from of channel.sources.email) {
      try {
        const days = Math.ceil(channel.windows.fetch_email_age_hours / 24);
        const messages = await fetchUnreadFrom(client, from, days, log);
        // Collect UIDs to mark in one batch at the end — one IMAP STORE per
        // sender instead of one per message. Includes empty-body messages too:
        // they're junk we can't process and leaving them unread just makes the
        // next cron tick re-fetch + re-skip the same garbage forever.
        // Only non-23505 insert errors stay unread, so a transient DB blip is
        // retried on the next tick (idempotency via external_id unique constraint).
        const toMarkRead: number[] = [];
        for (const m of messages) {
          const text = m.text?.trim() ? m.text : m.html;
          if (!text) { skipped++; toMarkRead.push(m.message_uid); continue; }
          const insert = await db.from('news_items').insert({
            channel: channel.name,
            source_type: 'email',
            source: from,
            title: m.subject || `(no subject from ${from})`,
            content: text.slice(0, 200_000),
            link: null,
            link_canonical: null,
            pub_date: m.date.toISOString(),
            external_id: m.message_id,
          }).select('id').single();
          if (insert.error) {
            if ((insert.error as { code?: string }).code === '23505') {
              skipped++;
              toMarkRead.push(m.message_uid);
            } else {
              failed++;
              log.warn({ event: 'insert_fail', err: insert.error.message, from }, 'email insert failed');
              continue;
            }
          } else {
            processed++;
            toMarkRead.push(m.message_uid);
          }
        }
        if (toMarkRead.length > 0) {
          try {
            await markRead(client, toMarkRead);
          } catch (e) {
            log.warn({
              event: 'mark_read_fail',
              from,
              count: toMarkRead.length,
              err: (e as Error).message,
            }, 'batch mark-read failed; messages will be re-fetched next tick');
          }
        }
      } catch (e) {
        log.warn({ event: 'email_fail', from, err: (e as Error).message }, 'fetch email failed');
        failed++;
      }
    }
  });
  } catch (e) {
    // IMAP connection itself failed — log + record but don't crash the whole
    // fetch step (RSS results upstream are preserved).
    log.warn({ event: 'imap_connect_fail', err: (e as Error).message }, 'imap unreachable; skipping email sources');
    failed += channel.sources.email.length;
  }

  return { processed, skipped, failed, notes: `${channel.sources.email.length} senders` };
}
