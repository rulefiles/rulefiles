import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parse } from 'yaml';

const load = (f) => {
  const text = fs.readFileSync(new URL(`../.github/workflows/${f}`, import.meta.url), 'utf8');
  return { text, doc: parse(text) };
};

test('workflows pin every action to a commit SHA and request only the permissions they use', () => {
  for (const f of ['ci.yml']) {
    const { text, doc } = load(f);
    for (const m of text.matchAll(/uses:\s*(\S+)/g)) assert.match(m[1], /@[0-9a-f]{40}$/, `${f}: ${m[1]}`);
    assert.ok(doc.permissions, `${f} sets permissions`);
  }
  assert.deepEqual(load('ci.yml').doc.permissions, { contents: 'read' });
  assert.equal(fs.existsSync(new URL('../.github/workflows/weekly-watch.yml', import.meta.url)), false, 'the weekly watch workflow is gone');
  assert.equal(fs.existsSync(new URL('../scripts/open-watch-pr.sh', import.meta.url)), false, 'open-watch-pr.sh is gone');
});

test('CI installs the locked dev dependencies before running the tests', () => {
  const steps = load('ci.yml').doc.jobs.test.steps.map((s) => s.run).filter(Boolean);
  assert.equal(steps[0], 'npm ci');
  assert.ok(steps.includes('npm test'));
});

test('the recommended ruleset is valid JSON and requires exactly the CI checks that ci.yml produces', () => {
  const ruleset = JSON.parse(fs.readFileSync(new URL('../docs/ruleset-main.json', import.meta.url), 'utf8'));
  assert.equal(ruleset.target, 'branch');
  assert.equal(ruleset.enforcement, 'active');
  assert.deepEqual(ruleset.conditions.ref_name.include, ['~DEFAULT_BRANCH']);
  const types = ruleset.rules.map((r) => r.type).sort();
  assert.deepEqual(types, ['deletion', 'non_fast_forward', 'pull_request', 'required_status_checks']);
  const [jobName, job] = Object.entries(load('ci.yml').doc.jobs)[0];
  const expected = job.strategy.matrix.node.map((n) => `${jobName} (${n})`).sort();
  const required = ruleset.rules.find((r) => r.type === 'required_status_checks').parameters.required_status_checks.map((c) => c.context).sort();
  assert.deepEqual(required, expected);
  assert.deepEqual(ruleset.rules.find((r) => r.type === 'pull_request').parameters.allowed_merge_methods, ['squash']);
});

test('CI offers a manual browser-preview run against a checked preview URL, with no new secret', () => {
  const { text, doc } = load('ci.yml');
  const input = doc.on.workflow_dispatch.inputs.base_url;
  assert.equal(input.required, true);
  assert.equal(input.type, 'string');
  const job = doc.jobs['browser-preview'];
  assert.equal(job.if, "github.event_name == 'workflow_dispatch'");
  const check = job.steps.find((s) => (s.run || '') === 'node scripts/check-preview-base-url.mjs');
  assert.ok(check, 'browser-preview checks the URL before the suite');
  assert.equal(check.env.BROWSER_BASE_URL, '${{ inputs.base_url }}');
  const step = job.steps.find((s) => (s.run || '') === 'npm run test:browser');
  assert.ok(step, 'browser-preview runs npm run test:browser');
  assert.equal(step.env.BROWSER_BASE_URL, '${{ inputs.base_url }}');
  assert.ok(!job.steps.some((s) => /npm run build/.test(s.run || '')), 'no local build: the suite hits the URL');
  assert.doesNotMatch(text, /pull_request_target|secrets\.|CLOUDFLARE|CF_API|wrangler/);
  // The input must never be interpolated into a run: line (only into env).
  assert.doesNotMatch(text, /run:.*inputs\.base_url/);
});
