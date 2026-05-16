// Reusable preview email sender. Called from `publish` step after each
// successful issue insert; also used by the oneoff script for ad-hoc resends.
//
// No-op when PREVIEW_EMAIL_TO env var is unset (production mode).
//
// Pre-flight rewrites for email-client compatibility:
//   - Inline <style> CSS into element style="" via juice
//   - Rewrite root-relative img/href URLs to absolute (Gmail/Outlook can't
//     resolve "/ainews/default.jpg" by themselves)
import nodemailer from 'nodemailer';
import juice from 'juice';
import type { Logger } from './log.js';

export interface PreviewIssue {
  id: number;
  title: string;
  content_html: string;
}

function rewriteRelativeUrls(html: string, base: string): string {
  return html
    .replace(/(<img\b[^>]*\bsrc\s*=\s*["'])\/([^"']+)/gi, `$1${base}/$2`)
    .replace(/(<a\b[^>]*\bhref\s*=\s*["'])\/([^"']+)/gi, `$1${base}/$2`);
}

export interface SendPreviewResult {
  sent: boolean;
  reason?: string;
  messageId?: string;
}

export async function sendPreviewEmail(
  issue: PreviewIssue,
  log: Logger,
): Promise<SendPreviewResult> {
  const recipient = (process.env.PREVIEW_EMAIL_TO ?? '').trim();
  if (!recipient) {
    return { sent: false, reason: 'PREVIEW_EMAIL_TO unset' };
  }
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (!gmailUser || !gmailPass) {
    return { sent: false, reason: 'GMAIL_USER / GMAIL_APP_PASSWORD unset' };
  }
  const base = (process.env.PREVIEW_BASE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.snapallx.com').replace(/\/$/, '');

  const inlined = juice(issue.content_html, { removeStyleTags: false, preserveImportant: true });
  const html = rewriteRelativeUrls(inlined, base);

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: gmailUser, pass: gmailPass },
  });

  try {
    const info = await transporter.sendMail({
      from: `"[AI]News (preview)" <${gmailUser}>`,
      to: recipient,
      subject: `[PREVIEW] ${issue.title}`,
      html,
    });
    log.info({
      event: 'preview_email_sent',
      issue_id: issue.id,
      to: recipient,
      message_id: info.messageId,
      html_bytes: html.length,
    }, '');
    return { sent: true, messageId: info.messageId };
  } catch (e) {
    const msg = (e as Error).message;
    log.warn({ event: 'preview_email_fail', issue_id: issue.id, to: recipient, err: msg }, '');
    return { sent: false, reason: msg };
  }
}
