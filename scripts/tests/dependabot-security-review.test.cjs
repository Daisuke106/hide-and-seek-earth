'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { run, evaluate, changes, manifestSafe, MARKER, REQUIRED } = require('../dependabot-security-review.cjs');

function fixture() {
  const repo = { owner: 'owner', repo: 'repo' };
  const pr = { number: 42, state: 'open', draft: false, mergeable: true,
    user: { login: 'dependabot[bot]' }, base: { ref: 'main', sha: 'base' },
    head: { sha: 'head', ref: 'dependabot/npm_and_yarn/example-1.0.1', repo: { full_name: 'owner/repo' } } };
  const data = {
    files: [{ filename: 'package-lock.json', status: 'modified' }], reviews: [],
    commits: [{ author: { login: 'dependabot[bot]' }, committer: { login: 'web-flow' }, commit: { verification: { verified: true } } }],
    checks: [{ name: 'CodeQL', status: 'completed', conclusion: 'neutral' }], statuses: [],
    runs: Object.keys(REQUIRED).map((path, i) => ({ path, id: i + 1, head_sha: 'head', event: 'pull_request', pull_requests: [{ number: 42 }], status: 'completed', conclusion: 'success' })),
    jobs: Object.fromEntries(Object.values(REQUIRED).map((names, i) => [i + 1, names.map((name) => ({ name, status: 'completed', conclusion: 'success' }))])),
    old: { lockfileVersion: 3, packages: { '': {}, 'node_modules/example': { version: '1.0.0' } } },
    next: { lockfileVersion: 3, packages: { '': {}, 'node_modules/example': { version: '1.0.1' } } },
    comparison: 'ahead', newAdvisories: [], oldAdvisories: [{ ghsa_id: 'GHSA-test-test-test', withdrawn_at: null }],
  };
  const writes = [], messages = [], failures = [];
  const method = (name) => Object.assign(() => {}, { id: name });
  const github = { rest: {
    repos: {
      compareCommitsWithBasehead: async () => ({ data: { status: data.comparison } }),
      getContent: async ({ ref }) => ({ data: { type: 'file', encoding: 'base64', content: Buffer.from(JSON.stringify(ref === 'base' ? data.old : data.next)).toString('base64') } }),
      getCombinedStatusForRef: async () => ({ data: { statuses: data.statuses } }),
    },
    pulls: {
      list: method('pulls'), listCommits: method('commits'), listFiles: method('files'), listReviews: method('reviews'),
      get: async () => ({ data: structuredClone(pr) }),
      createReview: async (params) => { writes.push({ method: 'approve', ...params }); return { data: { id: 99 } }; },
      dismissReview: async (params) => writes.push({ method: 'dismiss', ...params }),
    },
    actions: { listWorkflowRunsForRepo: method('runs'), listJobsForWorkflowRun: method('jobs') },
    checks: { listForRef: method('checks') },
  }, paginate: async (method, params) => {
    if (method === 'GET /advisories') {
      assert.equal(params.type, 'reviewed');
      assert.equal(params.is_withdrawn, false);
      return params.affects.includes('1.0.0') ? data.oldAdvisories : data.newAdvisories;
    }
    if (method.id === 'jobs') return data.jobs[params.run_id];
    if (method.id === 'pulls') return [pr];
    return data[method.id];
  } };
  const core = { info: (text) => messages.push(text), setFailed: (text) => failures.push(text) };
  const context = { repo, eventName: 'schedule', payload: {} };
  return { github, repo, pr, data, writes, messages, failures, core, context,
    evaluate: () => evaluate({ github, repo, pr, reviews: data.reviews }),
    run: (extra = {}) => run({ github, context, core, ...extra }) };
}

test('security fix with all checks passing approves the exact SHA once', async () => {
  const f = fixture();
  await f.run();
  assert.equal(f.writes.length, 1);
  assert.equal(f.writes[0].event, 'APPROVE');
  assert.equal(f.writes[0].commit_id, 'head');
  assert.match(f.writes[0].body, /GHSA-test-test-test/);
  f.data.reviews = [{ id: 1, user: { login: 'github-actions[bot]' }, state: 'APPROVED', commit_id: 'head', body: MARKER }];
  await f.run();
  assert.equal(f.writes.length, 1);
});
test('dry-run cannot approve or dismiss', async () => {
  const f = fixture();
  await f.run({ dryRun: true });
  assert.deepEqual(f.writes, []);
  f.data.reviews = [{ id: 1, user: { login: 'github-actions[bot]' }, state: 'APPROVED', commit_id: 'old', body: MARKER }];
  await f.run({ dryRun: true });
  assert.deepEqual(f.writes, []);
});
for (const [name, mutate] of [
  ['ordinary version update', (f) => { f.data.oldAdvisories = []; }],
  ['withdrawn advisory', (f) => { f.data.oldAdvisories[0].withdrawn_at = '2026-01-01'; }],
  ['vulnerability remains', (f) => { f.data.newAdvisories = f.data.oldAdvisories; }],
  ['human author', (f) => { f.pr.user.login = 'human'; }],
  ['fork', (f) => { f.pr.head.repo.full_name = 'fork/repo'; }],
  ['draft', (f) => { f.pr.draft = true; }],
  ['closed PR', (f) => { f.pr.state = 'closed'; }],
  ['non-main target', (f) => { f.pr.base.ref = 'develop'; }],
  ['conflict', (f) => { f.pr.mergeable = false; }],
  ['unknown mergeability', (f) => { f.pr.mergeable = null; }],
  ['stale base', (f) => { f.data.comparison = 'diverged'; }],
  ['human commit', (f) => { f.data.commits[0].author.login = 'human'; }],
  ['unverified commit', (f) => { f.data.commits[0].commit.verification.verified = false; }],
  ['non-GitHub signer', (f) => { f.data.commits[0].committer.login = 'human'; }],
  ['workflow change', (f) => { f.data.files.push({ filename: '.github/workflows/ci.yml', status: 'modified' }); }],
  ['source change', (f) => { f.data.files.push({ filename: 'app/Example.php', status: 'modified' }); }],
  ['file removal', (f) => { f.data.files[0].status = 'removed'; }],
  ['missing workflow', (f) => { f.data.runs.pop(); }],
  ['failed workflow', (f) => { f.data.runs[0].conclusion = 'failure'; }],
  ['pending workflow', (f) => { f.data.runs[0].status = 'in_progress'; }],
  ['missing job', (f) => { f.data.jobs[1].pop(); }],
  ['skipped job', (f) => { f.data.jobs[1][0].conclusion = 'skipped'; }],
  ['missing PR association', (f) => { f.data.runs[0].pull_requests = []; }],
  ['different commit checks', (f) => { f.data.runs[0].head_sha = 'old'; }],
  ['external check failure', (f) => { f.data.checks.push({ name: 'Scanner', status: 'completed', conclusion: 'failure' }); }],
  ['external check pending', (f) => { f.data.checks.push({ name: 'Scanner', status: 'in_progress' }); }],
  ['external check skipped', (f) => { f.data.checks.push({ name: 'Scanner', status: 'completed', conclusion: 'skipped' }); }],
  ['legacy status failure', (f) => { f.data.statuses.push({ state: 'failure' }); }],
  ['human requests changes', (f) => { f.data.reviews.push({ id: 1, user: { login: 'human' }, state: 'CHANGES_REQUESTED' }); }],
]) {
  test(`never approves: ${name}`, async () => {
    const f = fixture(); mutate(f); await f.run();
    assert.equal(f.writes.filter((w) => w.method === 'approve').length, 0);
  });
}
test('API errors do not become successful empty advisory results', async () => {
  const f = fixture(), original = f.github.paginate;
  f.github.paginate = async (method, params) => { if (method === 'GET /advisories') throw new Error('rate limited'); return original(method, params); };
  await f.run();
  assert.deepEqual(f.writes, []);
  assert.equal(f.failures.length, 1);
});
test('latest workflow rerun takes precedence over previous success', async () => {
  const f = fixture(); f.data.runs.push({ ...f.data.runs[0], id: 100, conclusion: 'failure' });
  assert.ok((await f.evaluate()).reason);
});
test('approval does not wait for its own running check; another app cannot spoof it', async () => {
  const f = fixture();
  f.data.checks.push({ name: 'Dependabot Security Review', app: { slug: 'github-actions' }, status: 'in_progress' });
  assert.equal((await f.evaluate()).approved, true);
  f.data.checks[1].app.slug = 'another-app';
  assert.ok((await f.evaluate()).reason);
});
test('changed head or base during evaluation is never approved', async () => {
  for (const change of ['head', 'base']) {
    const f = fixture(); let calls = 0;
    f.github.rest.pulls.get = async () => { const pr = structuredClone(f.pr); if (++calls > 1) pr[change].sha = 'changed'; return { data: pr }; };
    await f.run(); assert.deepEqual(f.writes, []);
  }
});
test('rerun failure immediately before approving blocks approval', async () => {
  const f = fixture(), original = f.github.paginate; let calls = 0;
  f.github.paginate = async (method, params) => { if (method.id === 'runs' && ++calls > 1) return []; return original(method, params); };
  await f.run(); assert.deepEqual(f.writes, []);
});
test('a commit pushed during the approval request revokes the new review', async () => {
  const f = fixture(); let calls = 0;
  f.github.rest.pulls.get = async () => { const pr = structuredClone(f.pr); if (++calls > 2) pr.head.sha = 'changed'; return { data: pr }; };
  await f.run();
  assert.deepEqual(f.writes.map((w) => w.method), ['approve', 'dismiss']);
});
test('stale automatic approval is revoked when head changes and CI fails', async () => {
  const f = fixture();
  f.data.reviews = [{ id: 1, user: { login: 'github-actions[bot]' }, state: 'APPROVED', commit_id: 'old', body: MARKER }];
  f.data.runs[0].conclusion = 'failure'; await f.run();
  assert.equal(f.writes.length, 1); assert.equal(f.writes[0].method, 'dismiss');
});
test('human approval is never dismissed', async () => {
  const f = fixture();
  f.data.reviews = [{ id: 1, user: { login: 'human' }, state: 'APPROVED', commit_id: 'old', body: MARKER }];
  f.data.runs[0].conclusion = 'failure'; await f.run(); assert.deepEqual(f.writes, []);
});
test('duplicate vulnerable nested versions remain subject to advisory lookup', () => {
  const f = fixture(); f.data.next.packages['node_modules/nested/node_modules/example'] = { version: '1.0.0' };
  const delta = changes(f.data.old, f.data.next, false);
  assert.deepEqual(delta.previous, ['example@1.0.0']);
  assert.deepEqual(new Set(delta.current), new Set(['example@1.0.1', 'example@1.0.0']));
});
test('Composer dev dependencies are included; unsupported versions fail closed', () => {
  const before = { 'packages-dev': [{ name: 'a/b', version: 'v1.0.0' }] };
  const after = { 'packages-dev': [{ name: 'a/b', version: 'v1.0.1' }] };
  assert.deepEqual(changes(before, after, true), { previous: ['a/b@1.0.0'], current: ['a/b@1.0.1'] });
  assert.throws(() => changes(before, { 'packages-dev': [{ name: 'a/b', version: 'dev-main' }] }, true));
});
test('manifest dependency versions may change, scripts and configuration may not', () => {
  assert.ok(manifestSafe({ scripts: { test: 'jest' }, dependencies: { a: '1' } }, { dependencies: { a: '2' }, scripts: { test: 'jest' } }, false));
  assert.equal(manifestSafe({}, { scripts: { test: 'curl attacker' } }, false), false);
  assert.equal(manifestSafe({}, { config: { 'allow-plugins': true } }, true), false);
});
