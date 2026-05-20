// One-off: send a specific (or latest) AI issue as PREVIEW email. Useful for
// resending an old issue / picking by id manually. For the auto-send-on-publish
// flow, see src/lib/previewEmail.ts (invoked from src/steps/publish.ts).
//
// Usage:
//   set -a; source .env.local; set +a
//   ./node_modules/.bin/tsx scripts/oneoff/preview-email.ts you@example.com        # → latest ai/zh_CN
//   ./node_modules/.bin/tsx scripts/oneoff/preview-email.ts you@example.com 21     # → specific issue id
//   PREVIEW_EMAIL_TO=you@example.com ./node_modules/.bin/tsx scripts/oneoff/preview-email.ts
import { createDb } from '../../src/lib/db.js';
import { sendPreviewEmail } from '../../src/lib/previewEmail.js';
import { createLogger } from '../../src/lib/log.js';

function usage(msg?: string): never {
  if (msg) console.error(`error: ${msg}\n`);
  console.error('usage: preview-email.ts <recipient-email> [issue-id]');
  console.error('   or: PREVIEW_EMAIL_TO=<email> preview-email.ts [issue-id]');
  process.exit(2);
}

async function main() {
  const recipientArg = process.argv[2];
  const issueIdArg = process.argv[3];

  // Recipient resolution order: CLI arg → PREVIEW_EMAIL_TO env → error
  if (recipientArg && recipientArg.includes('@')) {
    process.env.PREVIEW_EMAIL_TO = recipientArg;
  } else if (recipientArg && !issueIdArg && /^\d+$/.test(recipientArg)) {
    // Allow `preview-email.ts 21` when PREVIEW_EMAIL_TO is set
    if (!process.env.PREVIEW_EMAIL_TO) usage('first arg looks like an issue id but PREVIEW_EMAIL_TO is not set');
  } else if (recipientArg) {
    usage(`first arg "${recipientArg}" does not look like an email`);
  }
  if (!process.env.PREVIEW_EMAIL_TO) usage('no recipient — pass as first arg or set PREVIEW_EMAIL_TO');

  // If recipientArg was actually an issue id, shift it
  const issueId = issueIdArg ?? (recipientArg && /^\d+$/.test(recipientArg) ? recipientArg : undefined);

  const log = createLogger({ channel: 'ai', step: 'preview-email-oneoff' });
  const db = createDb();
  let query = db.from('issues').select('id, title, content_html, lang, delivered').eq('channel', 'ai');
  if (issueId) {
    query = query.eq('id', Number(issueId));
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
