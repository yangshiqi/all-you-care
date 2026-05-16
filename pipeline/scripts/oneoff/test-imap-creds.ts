// Local IMAP credential test — verifies your .env.local credentials actually
// work against imap.gmail.com. If this succeeds, the GitHub secret value is
// where the mismatch is (typically a trailing newline from `gh secret set`).
//
// Usage:
//   cd pipeline && set -a; source .env.local; set +a; ./node_modules/.bin/tsx scripts/oneoff/test-imap-creds.ts
//
// Compare its safe fingerprint (length + first 2 + last 2 chars) with what
// you remember pasting into the GitHub secret form.
import { ImapFlow } from 'imapflow';

function fp(s: string | undefined): string {
  if (!s) return '<unset>';
  return `len=${s.length} first2="${s.slice(0, 2)}" last2="${s.slice(-2)}" hasSpace=${/\s/.test(s)} hasNewline=${/[\r\n]/.test(s)}`;
}

async function main() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  console.log('GMAIL_USER fingerprint:        ', fp(user));
  console.log('GMAIL_APP_PASSWORD fingerprint:', fp(pass));
  if (!user || !pass) { console.error('missing env'); process.exit(1); }

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: {
      debug: () => {},
      info:  () => {},
      warn:  (o) => console.log('warn:', o),
      error: (o) => console.log('error:', o),
    },
  });
  try {
    await client.connect();
    console.log('✅ CONNECT OK — credentials are valid against imap.gmail.com');
    const mailbox = await client.getMailboxLock('INBOX');
    try {
      console.log('inbox path:', client.mailbox && (client.mailbox as { path: string }).path);
    } finally { mailbox.release(); }
    await client.logout();
  } catch (e) {
    console.log('❌ CONNECT FAILED');
    console.log('err:', (e as Error).message);
    console.log('response:', (e as { response?: string }).response);
    process.exit(1);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
