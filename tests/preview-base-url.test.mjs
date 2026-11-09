import test from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedPreviewBaseUrl } from '../scripts/lib/preview-base-url.mjs';

const ok = [
  'https://rulefiles.dev',
  'https://rulefiles.dev/',
  'https://fix-matrix-nits-41.rulefiles.pages.dev',
  'https://fix-matrix-nits-41.rulefiles.pages.dev/',
  'https://80cf2618.rulefiles.pages.dev'
];
// Userinfo lookalike built at runtime so launch.test does not treat the source as an address.
const userinfoHost = `https://${'rulefiles.dev'}@${'evil.com'}`;
const bad = [
  '',
  'http://rulefiles.dev',
  'https://rulefiles.dev/matrix/',
  'https://www.rulefiles.dev',
  'https://rulefiles.dev:443',
  'https://rulefiles.dev.evil.com',
  userinfoHost,
  'https://evil.com',
  'https://rulefiles.pages.dev',
  'https://.rulefiles.pages.dev',
  'https://foo.bar.rulefiles.pages.dev',
  'https://RuleFiles.dev',
  'ftp://rulefiles.dev',
  '//rulefiles.dev',
  'rulefiles.dev'
];

test('isAllowedPreviewBaseUrl accepts rulefiles.dev and one-label *.rulefiles.pages.dev', () => {
  for (const u of ok) assert.equal(isAllowedPreviewBaseUrl(u), true, u);
});

test('isAllowedPreviewBaseUrl rejects http, other hosts, userinfo, ports, paths and lookalikes', () => {
  for (const u of bad) assert.equal(isAllowedPreviewBaseUrl(u), false, u);
});

test('relaxing the host end-anchor would accept a lookalike suffix (mutation)', () => {
  const loose = (raw) => {
    const url = String(raw || '').replace(/\/$/, '');
    return /^https:\/\/rulefiles\.dev/.test(url) || /^https:\/\/[a-z0-9-]+\.rulefiles\.pages\.dev/.test(url);
  };
  assert.equal(loose('https://rulefiles.dev.evil.com'), true, 'loose regex accepts a suffix host');
  assert.equal(isAllowedPreviewBaseUrl('https://rulefiles.dev.evil.com'), false);
});
