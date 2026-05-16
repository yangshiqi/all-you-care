const TRACKING_PARAMS = new Set([
  'utm_source','utm_medium','utm_campaign','utm_term','utm_content','utm_id',
  'fbclid','gclid','dclid','msclkid','mc_cid','mc_eid','ref','ref_src',
]);

const UNWRAP_KEYS = ['u','url','dest','redirect','target'];

export function canonicalizeLink(input: string): string {
  let url: URL;
  try { url = new URL(input); } catch { return input; }
  url.hostname = url.hostname.toLowerCase();

  // 1. AMP cache: https://www.google.com/amp/s/<host>/<path>
  if (url.hostname === 'www.google.com' && url.pathname.startsWith('/amp/s/')) {
    const rest = url.pathname.slice('/amp/s/'.length);
    return canonicalizeLink('https://' + rest);
  }

  // 2. Tracking redirect via known query keys
  for (const k of UNWRAP_KEYS) {
    const v = url.searchParams.get(k);
    if (v && /^https?%3A%2F%2F|^https?:\/\//i.test(v)) {
      const decoded = decodeURIComponent(v);
      try {
        new URL(decoded);
        return canonicalizeLink(decoded);
      } catch { /* fall through */ }
    }
  }

  // 3. Strip tracking params
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.has(key.toLowerCase())) url.searchParams.delete(key);
  }

  return url.toString();
}
