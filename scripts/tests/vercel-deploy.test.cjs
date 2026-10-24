'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { REQUIRED, parseCommand, authorize } = require('../vercel-deploy-policy.cjs');
const { publicUrl, validateEnvironment, validateProject, fingerprint, probeApi } = require('../vercel-preflight.cjs');
const { smoke } = require('../vercel-smoke.cjs');
const { diagnoseFailure, reportFailure } = require('../vercel-preflight.cjs');
const { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve, basename } = require('node:path');
const { spawnSync } = require('node:child_process');

const SHA = 'a'.repeat(40);
function fixture(environment = 'staging') {
  const comment = { id: 10, body: `/deploy ${environment} ${SHA} --verified`, user: { id: 5, login: 'maintainer', type: 'User' },
    created_at: '2026-10-24T00:00:00Z', updated_at: '2026-10-24T00:00:00Z' };
  const repo = { owner: 'owner', repo: 'repo' };
  const state = { permission: 'write', sha: SHA, comment: structuredClone(comment),
    pr: { merged: true, merge_commit_sha: SHA, base: { ref: 'main', repo: { full_name: 'owner/repo' } } },
    runs: Object.keys(REQUIRED).map((workflow, index) => ({ workflow, id: index + 1, head_sha: SHA, head_branch: 'main',
      event: 'push', head_repository: { full_name: 'owner/repo' }, status: 'completed', conclusion: 'success' })),
    jobs: Object.fromEntries(Object.values(REQUIRED).map((names, index) => [index + 1, names.map(name => ({ name, status: 'completed', conclusion: 'success' }))])),
    staging: [],
  };
  const github = { rest: {
    repos: { getCollaboratorPermissionLevel: async () => ({ data: { permission: state.permission } }), getBranch: async () => ({ data: { commit: { sha: state.sha } } }) },
    issues: { getComment: async () => ({ data: state.comment }) }, pulls: { get: async () => ({ data: state.pr }) },
    actions: { listWorkflowRuns: 'runs', listJobsForWorkflowRun: 'jobs' },
  }, paginate: async (method, params) => method === 'jobs' ? (state.jobs[params.run_id] || []) :
    params.workflow_id === 'deploy.yml' ? state.staging : state.runs.filter(r => r.workflow === params.workflow_id) };
  const context = { repo, sha: SHA, runId: 99, eventName: 'issue_comment', payload: { action: 'created',
    repository: { default_branch: 'main' }, issue: { number: 205, pull_request: {} }, comment } };
  return { state, github, context, now: Date.parse('2026-10-24T00:10:00Z') };
}

test('exact command binds the merged SHA and human verification', () => {
  assert.deepEqual(parseCommand(`/deploy staging ${SHA} --verified`), { environment: 'staging', sha: SHA });
  for (const body of [`/deploy staging ${SHA}`, '/deploy staging main --verified', `/deploy production ${SHA} --verified; echo unsafe`, `/deploy staging ${SHA} --verified\nextra`, `/deploy dev ${SHA} --verified`]) assert.throws(() => parseCommand(body));
});
test('authorized newly merged and fully checked main may deploy staging', async () => {
  const f = fixture(); assert.equal((await authorize(f)).sha, SHA);
});
for (const [name, change] of [
  ['ordinary issue', f => delete f.context.payload.issue.pull_request],
  ['edited event', f => { f.context.payload.action = 'edited'; }],
  ['bot', f => { f.context.payload.comment.user.type = 'Bot'; }],
  ['read-only collaborator', f => { f.state.permission = 'read'; }],
  ['edited live command', f => { f.state.comment.body += ' '; }],
  ['edited then restored', f => { f.state.comment.updated_at = '2026-10-24T00:01:00Z'; }],
  ['expired approval', f => { f.now += 86400000; }],
  ['unmerged PR', f => { f.state.pr.merged = false; }],
  ['different merge commit', f => { f.state.pr.merge_commit_sha = 'b'.repeat(40); }],
  ['different repository', f => { f.state.pr.base.repo.full_name = 'other/repo'; }],
  ['main moved', f => { f.state.sha = 'b'.repeat(40); }],
  ['event SHA differs', f => { f.context.sha = 'b'.repeat(40); }],
  ['missing CI', f => { f.state.runs.pop(); }],
  ['incomplete CI', f => { f.state.runs[0].status = 'in_progress'; }],
  ['failed CI', f => { f.state.runs[0].conclusion = 'failure'; }],
  ['skipped required test', f => { f.state.jobs[1][0].conclusion = 'skipped'; }],
  ['missing audit job', f => { f.state.jobs[3].shift(); }],
  ['newer failed CI after older success', f => { f.state.runs.push({ ...f.state.runs[0], id: 50, conclusion: 'failure' }); }],
  ['foreign workflow repository', f => { f.state.runs[0].head_repository.full_name = 'other/repo'; }],
]) test(`reject ${name}`, async () => { const f = fixture(); change(f); await assert.rejects(authorize(f)); });

test('production requires staging completion before the human production command', async () => {
  const f = fixture('production');
  await assert.rejects(authorize(f), /staging/);
  f.state.staging = [{ id: 20, head_sha: SHA, event: 'issue_comment', head_repository: { full_name: 'owner/repo' },
    status: 'completed', conclusion: 'success', updated_at: '2026-10-23T23:59:00Z' }];
  f.state.jobs[20] = [{ name: 'Deploy staging', conclusion: 'success' }];
  assert.equal((await authorize(f)).environment, 'production');
  f.state.staging[0].updated_at = '2026-10-24T00:01:00Z';
  await assert.rejects(authorize(f), /staging/);
  f.state.staging[0].updated_at = '2026-10-23T23:59:00Z';
  f.state.jobs[20][0].conclusion = 'failure';
  await assert.rejects(authorize(f), /staging/);
});

const API = 'https://api.hide-and-seek-earth.net/api';
const ORIGIN = 'https://hide-and-seek-earth.vercel.app';
const publicEnv = () => ({ REACT_APP_API_URL: API, REACT_APP_GOOGLE_MAPS_API_KEY: 'AIza' + 'x'.repeat(35) });

test('missing Preview API and Maps variables have distinct actionable diagnoses', () => {
  for (const [env, expected] of [[{}, 'API_URL_MISSING'], [{ REACT_APP_API_URL: API }, 'MAPS_KEY_MISSING'],
    [{ ...publicEnv(), REACT_APP_API_URL: 'https://different.net/api' }, 'API_URL_MISMATCH']]) {
    let caught;
    try { validateEnvironment(env, API); } catch (error) { caught = error; }
    assert.equal(diagnoseFailure(caught).code, expected);
    assert.match(diagnoseFailure(caught).message, /Vercel/);
  }
});

test('diagnostics write a safe annotation, output and Summary without provider errors or secret values', () => {
  const logs = [], files = new Map();
  const error = Object.assign(new Error('token=private-provider-value\n::error::unsafe'), { preflightCode: 'unknown-secret-value' });
  const result = reportFailure(error, { GITHUB_OUTPUT: 'output', GITHUB_STEP_SUMMARY: 'summary' },
    message => logs.push(message), (file, content) => files.set(file, content));
  assert.equal(result.code, 'PREFLIGHT_FAILED');
  assert.equal(files.get('output'), 'failure_code=PREFLIGHT_FAILED\n');
  assert.match(files.get('summary'), /PREFLIGHT_FAILED/);
  assert.doesNotMatch(logs.join('\n') + files.get('summary'), /private-provider-value|unknown-secret-value|unsafe/);
  assert.equal(diagnoseFailure(new Error('Deployment check failed (HTTP 403)')).code, 'ACCESS_DENIED');
  assert.equal(diagnoseFailure(new Error('API POST/CORS preflight failed')).code, 'API_CORS_INVALID');
});

test('CLI reproduces the empty Preview file failure and emits a useful reason before any network request', t => {
  const testDir = mkdtempSync(join(tmpdir(), 'hns-preflight-'));
  t.after(() => {
    assert.ok(resolve(testDir).startsWith(resolve(tmpdir()) + require('node:path').sep));
    assert.ok(basename(testDir).startsWith('hns-preflight-'));
    rmSync(testDir, { recursive: true, force: true });
  });
  mkdirSync(join(testDir, 'hns-frontend'));
  mkdirSync(join(testDir, '.vercel'));
  writeFileSync(join(testDir, 'hns-frontend/vercel.json'), JSON.stringify({ git: { deploymentEnabled: false } }));
  writeFileSync(join(testDir, '.vercel/.env.preview.local'), 'VERCEL_TOKEN=private-test-value\n');
  const output = join(testDir, 'output'), summary = join(testDir, 'summary');
  const result = spawnSync(process.execPath, [resolve(__dirname, '../vercel-preflight.cjs'), 'record'], {
    cwd: testDir, encoding: 'utf8', env: { ...process.env, TARGET: 'preview', DEPLOY_ENVIRONMENT: 'staging',
      GITHUB_OUTPUT: output, GITHUB_STEP_SUMMARY: summary, DEPLOY_API_URL: API },
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /API_URL_MISSING.*Preview/);
  assert.doesNotMatch(result.stderr, /private-test-value/);
  assert.equal(readFileSync(output, 'utf8'), 'failure_code=API_URL_MISSING\n');
  assert.match(readFileSync(summary, 'utf8'), /REACT_APP_API_URL/);
});
test('require reviewed API, Maps key, and a strict browser-variable allowlist', () => {
  assert.equal(validateEnvironment(publicEnv(), API).href, API);
  for (const env of [ { ...publicEnv(), REACT_APP_API_URL: 'http://localhost:8000/api' },
    { ...publicEnv(), REACT_APP_GOOGLE_MAPS_API_KEY: 'your_google_maps_api_key_here' },
    { ...publicEnv(), REACT_APP_SECRET: 'unsafe' }, { ...publicEnv(), VITE_SECRET: 'unsafe' },
    { ...publicEnv(), PUBLIC_URL: 'https://other.net' }, { ...publicEnv(), APP_DEBUG: 'true' } ]) assert.throws(() => validateEnvironment(env, API));
  assert.throws(() => validateEnvironment(publicEnv(), 'https://other.net/api'));
});
test('reject credentials, local addresses and non-HTTPS endpoints', () => {
  for (const url of ['http://public.net/api', 'https://127.0.0.1/api', 'https://[::1]/api', 'https://localhost/api',
    'https://foo.internal/api', 'https://foo.example.com/api', 'https://user:pass@public.net/api', 'https://public.net/api?q=secret']) assert.throws(() => publicUrl(url, 'API'));
});
test('validate actual Vercel project, root, runtime and bypass hooks', () => {
  const env = { VERCEL_PROJECT_ID: 'project', VERCEL_ORG_ID: 'team' };
  const project = { id: 'project', accountId: 'team', rootDirectory: 'hns-frontend', framework: 'vite', nodeVersion: '22.x' };
  assert.equal(validateProject(project, env).rootDirectory, 'hns-frontend');
  for (const change of [{ id: 'other' }, { accountId: 'other' }, { rootDirectory: './' }, { nodeVersion: '20.x' }, { link: { deployHooks: [{}] } }]) assert.throws(() => validateProject({ ...project, ...change }, env));
});
test('configuration fingerprint ignores ordering and detects public/private setting changes', () => {
  const salt = randomBytes(32);
  assert.deepEqual(fingerprint({ a: '1', b: '2' }, {}, salt), fingerprint({ b: '2', a: '1' }, {}, salt));
  assert.notDeepEqual(fingerprint(publicEnv(), { protection: true }, salt), fingerprint(publicEnv(), { protection: false }, salt));
  assert.notDeepEqual(fingerprint(publicEnv(), {}, salt), fingerprint({ ...publicEnv(), REACT_APP_GOOGLE_MAPS_API_KEY: 'different' }, {}, salt));
  assert.notDeepEqual(fingerprint(publicEnv(), {}, salt), fingerprint(publicEnv(), {}, randomBytes(32)));
  assert.throws(() => fingerprint(publicEnv(), {}, Buffer.alloc(8)), /salt/);
});

function apiResponse(url, options, override = {}) {
  const headers = { 'content-type': 'application/json', 'access-control-allow-origin': options.headers.Origin,
    'access-control-allow-methods': 'GET, POST', 'access-control-allow-headers': 'content-type', ...override };
  return new Response(JSON.stringify(String(url).endsWith('/health') ? { status: 'ok' } : []), { headers });
}
test('probe real read endpoints and preflight; never mutate data or follow redirects', async () => {
  const calls = [];
  await probeApi(API, ORIGIN, async (url, options) => { calls.push([url, options]); return apiResponse(url, options); });
  assert.equal(calls.length, 4);
  assert.deepEqual(calls.map(([, options]) => options.method || 'GET'), ['GET', 'GET', 'GET', 'OPTIONS']);
  assert.ok(calls.every(([, options]) => options.redirect === 'error'));
  await assert.rejects(probeApi(API, ORIGIN, async (url, options) => apiResponse(url, options, { 'access-control-allow-origin': '*' })), /CORS/);
  await assert.rejects(probeApi(API, ORIGIN, async () => new Response('DB unavailable', { status: 500 })), /HTTP 500/);
});
test('candidate smoke checks assets and routes, and limits bypass credentials to the deployment', async () => {
  const calls = [];
  const fakeFetch = async (url, options) => {
    url = String(url); calls.push([url, options]);
    if (new URL(url).origin === new URL(API).origin) return apiResponse(url, options);
    return new Response(url.endsWith('.js') ? 'app()' : '<div id="root"></div><script type="module" src="/assets/app.js"></script>', {
      headers: { 'content-type': url.endsWith('.js') ? 'application/javascript' : 'text/html', 'x-content-type-options': 'nosniff' },
    });
  };
  await smoke({ DEPLOYMENT_URL: ORIGIN, BYPASS_SECRET: 'private', DEPLOY_API_URL: API }, fakeFetch);
  assert.equal(calls.filter(([url]) => new URL(url).origin === ORIGIN).length, 6);
  assert.ok(calls.filter(([url]) => new URL(url).origin === new URL(API).origin).every(([, options]) => !options.headers['x-vercel-protection-bypass']));
  await assert.rejects(smoke({ DEPLOYMENT_URL: 'https://attacker.net' }, fakeFetch));
  await assert.rejects(smoke({ DEPLOYMENT_URL: `${ORIGIN}.attacker.net` }, fakeFetch), /deployment URL/);
  await assert.rejects(smoke({ DEPLOYMENT_URL: ORIGIN, DEPLOY_API_URL: API }, async () => new Response('<div id="root"></div>', {
    headers: { 'content-type': 'text/html', 'x-content-type-options': 'nosniff' },
  })), /JavaScript/);
});
