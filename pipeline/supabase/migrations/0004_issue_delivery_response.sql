-- Capture per-deliver response detail on `issues`.
--
-- Up to now, `deliver` only flipped `delivered=true` on HTTP 2xx — the body of
-- the response (per-recipient success/failure, messageIds, errors) was thrown
-- away. When subscribers reported "didn't get the email", there was no DB
-- record to consult; the only audit trail was Vercel + Brevo dashboard.
--
-- These three columns let the pipeline record:
--   * how many recipients succeeded / failed for the last successful send
--   * the raw JSON body (truncated to 64 KB by route) for forensic lookup
--
-- delivery_attempt_count and delivery_last_error are untouched — they cover
-- the failure path; the new columns cover the success path.

alter table issues
  add column if not exists delivery_success_count int,
  add column if not exists delivery_failed_count  int,
  add column if not exists delivery_response      jsonb;
