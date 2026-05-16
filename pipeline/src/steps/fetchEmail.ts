// pipeline/src/steps/fetchEmail.ts
import type { StepContext, StepResult } from '../cli.js';
import { withImap, fetchUnreadFrom, markRead } from '../lib/imap.js';

export async function run(ctx: StepContext): Promise<StepResult> {
  const { channel, db, log } = ctx;
  let processed = 0, skipped = 0, failed = 0;

  await withImap(log, async client => {
    for (const from of channel.sources.email) {
      try {
        const days = Math.ceil(channel.windows.fetch_email_age_hours / 24);
        const messages = await fetchUnreadFrom(client, from, days, log);
        for (const m of messages) {
          const text = m.text?.trim() ? m.text : m.html;
          if (!text) { skipped++; continue; }
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
            } else {
              failed++;
              log.warn({ event: 'insert_fail', err: insert.error.message, from }, 'email insert failed');
              continue;
            }
          } else {
            processed++;
          }
          try { await markRead(client, m.message_uid); } catch (e) {
            log.warn({ event: 'mark_read_fail', uid: m.message_uid, err: (e as Error).message }, '');
          }
        }
      } catch (e) {
        log.warn({ event: 'email_fail', from, err: (e as Error).message }, 'fetch email failed');
        failed++;
      }
    }
  });

  return { processed, skipped, failed, notes: `${channel.sources.email.length} senders` };
}
