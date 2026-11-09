/**
 * Allowed BROWSER_BASE_URL values for the manual CI browser-preview job.
 * Only https://rulefiles.dev and https://<one-label>.rulefiles.pages.dev, optional trailing slash.
 * Rejects http, other hosts, userinfo, ports, paths and lookalike suffixes.
 */
export function isAllowedPreviewBaseUrl(raw) {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > 200) return false;
  // One trailing slash is allowed; nothing else after the host.
  const url = raw.replace(/\/$/, '');
  if (url.includes('\\') || url.includes('@') || url.includes('?') || url.includes('#') || url.includes(':') && !url.startsWith('https://')) return false;
  // After stripping one trailing slash, no further slash (no path) and no port (no : after the scheme).
  if (url.slice('https://'.length).includes('/') || url.slice('https://'.length).includes(':')) return false;
  if (url === 'https://rulefiles.dev') return true;
  return /^https:\/\/[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.rulefiles\.pages\.dev$/.test(url);
}
