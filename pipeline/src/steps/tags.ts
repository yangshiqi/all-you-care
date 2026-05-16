// pipeline/src/steps/tags.ts
import type { StepContext, StepResult } from '../cli.js';
import type { Lang } from '../lib/db.js';

export async function run(ctx: StepContext): Promise<StepResult> {
  const { channel, db, log, dryRun } = ctx;
  const langs: Lang[] = ['zh_CN', 'en'];
  let processed = 0;

  for (const lang of langs) {
    // Read all tags from issues for this channel + lang
    const { data, error } = await db.from('issues')
      .select('tags').eq('channel', channel.name).eq('lang', lang);
    if (error) {
      log.warn({ event: 'tags_read_fail', lang, err: error.message }, '');
      continue;
    }

    // Aggregate
    const counts = new Map<string, number>();
    for (const row of (data ?? []) as { tags: string[] }[]) {
      for (const t of row.tags ?? []) {
        const key = t.trim();
        if (!key) continue;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }

    if (dryRun) {
      log.info({ event: 'dry_run', would_upsert_tags: counts.size, lang }, '');
      processed += counts.size;
      continue;
    }

    // Full upsert + delete missing
    const rows = [...counts.entries()].map(([name, total]) => ({
      channel: channel.name, lang, name, total, updated_at: new Date().toISOString(),
    }));
    if (rows.length > 0) {
      const { error: upErr } = await db.from('tag_counts').upsert(rows as never, {
        onConflict: 'channel,lang,name',
      });
      if (upErr) {
        log.warn({ event: 'tags_upsert_fail', lang, err: upErr.message }, '');
        continue;
      }
    }
    // Delete names not in current set
    const namesEsc = [...counts.keys()].map(k => `"${k.replace(/"/g, '\\"')}"`).join(',') || 'null';
    const { error: delErr } = await db.from('tag_counts')
      .delete()
      .eq('channel', channel.name)
      .eq('lang', lang)
      .not('name', 'in', `(${namesEsc})`);
    if (delErr) log.warn({ event: 'tags_delete_fail', lang, err: delErr.message }, '');

    processed += counts.size;
    log.info({ event: 'tags_ok', lang, count: counts.size }, '');
  }
  return { processed, skipped: 0, failed: 0, notes: '' };
}
