// One-off: send a specific (or latest) AI issue as PREVIEW email. Useful for
// resending an old issue / picking by id manually. For the auto-send-on-publish
// flow, see src/lib/previewEmail.ts (invoked from src/steps/publish.ts).
//
// Usage:
//   set -a; source .env.local; set +a
//   ./node_modules/.bin/tsx scripts/oneoff/preview-email.ts                    # → latest ai/zh_CN, PREVIEW_EMAIL_TO env or fallback
//   ./node_modules/.bin/tsx scripts/oneoff/preview-email.ts you@example.com    # → override recipient
//   ./node_modules/.bin/tsx scripts/oneoff/preview-email.ts you@example.com 21 # → specific issue id
import { createDb } from '../../src/lib/db.js';
import { sendPreviewEmail } from '../../src/lib/previewEmail.js';
import { createLogger } from '../../src/lib/log.js';

const FALLBACK_RECIPIENT = 'yangshiqi1089@gmail.com';

async function main() {
  const recipientArg = process.argv[2];
  const issueIdArg = process.argv[3];

  if (recipientArg) process.env.PREVIEW_EMAIL_TO = recipientArg;
  if (!process.env.PREVIEW_EMAIL_TO) process.env.PREVIEW_EMAIL_TO = FALLBACK_RECIPIENT;

  const log = createLogger({ channel: 'ai', step: 'preview-email-oneoff' });
  const db = createDb();
  let query = db.from('issues').select('id, title, content_html, lang, delivered').eq('channel', 'ai');
  if (issueIdArg) {
    query = query.eq('id', Number(issueIdArg));
  } else {
    query = query.eq('lang', 'zh_CN').order('id', { ascending: false }).limit(1);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const issue = (data ?? [])[0];
  if (!issue) {
    console.error('no matching issue found');
    process.exit(1);
  }
  console.log(`issue id=${issue.id} title="${issue.title}" lang=${issue.lang} delivered=${issue.delivered}`);
  console.log(`sending to: ${process.env.PREVIEW_EMAIL_TO}`);

  const result = await sendPreviewEmail(
    { id: issue.id, title: issue.title, content_html: issue.content_html },
    log,
  );
  console.log('result:', JSON.stringify(result, null, 2));
  if (!result.sent) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
