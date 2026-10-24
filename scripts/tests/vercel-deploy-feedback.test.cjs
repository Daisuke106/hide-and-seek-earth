'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { notify, renderStatus, missingSettings, settingsMessage } = require('../vercel-deploy-feedback.cjs');
const { reviewedOrigin, probeApiReads, probeApi } = require('../vercel-preflight.cjs');

function fixture() {
  const context = { eventName: 'issue_comment', runId: 501, serverUrl: 'https://github.com',
    repo: { owner: 'owner', repo: 'repo' }, issue: { number: 206 }, payload: { action: 'created',
      issue: { pull_request: {} }, comment: { id: 10, body: `/deploy staging ${'a'.repeat(40)} --verified`, user: { type: 'User', login: 'maintainer' } } } };
  const state = { permission: 'write', comments: [], reactions: [{ id: 1, content: 'eyes', user: { login: 'human' } }], warnings: [], creates: 0 };
  const github = { rest: {
    repos: { getCollaboratorPermissionLevel: async () => ({ data: { permission: state.permission } }) },
    issues: {
      listComments: async () => state.comments,
      createComment: async params => { state.creates++; state.comments.push({ id: 20 + state.creates, body: params.body, user: { login: 'github-actions[bot]' } }); },
      updateComment: async params => { state.comments.find(comment => comment.id === params.comment_id).body = params.body; },
    },
    reactions: {
      listForIssueComment: async () => state.reactions,
      createForIssueComment: async params => {
        if (!state.reactions.some(reaction => reaction.content === params.content && reaction.user.login === 'github-actions[bot]')) {
          state.reactions.push({ id: state.reactions.length + 2, content: params.content, user: { login: 'github-actions[bot]' } });
        }
      },
      deleteForIssueComment: async params => { state.reactions = state.reactions.filter(reaction => reaction.id !== params.reaction_id); },
    },
  }, paginate: async (endpoint, params) => endpoint(params) };
  return { context, github, state, warn: warning => state.warnings.push(warning) };
}

test('request acknowledgement links to the actual run without claiming deployment has started', async () => {
  const f = fixture();
  await notify({ ...f, phase: 'received' });
  assert.equal(f.state.creates, 1);
  assert.match(f.state.comments[0].body, /actions\/runs\/501/);
  assert.match(f.state.comments[0].body, /許可条件を確認/);
  assert.doesNotMatch(f.state.comments[0].body, /デプロイを開始します/);
  assert.ok(f.state.reactions.some(reaction => reaction.user.login === 'github-actions[bot]' && reaction.content === 'eyes'));
});

test('one status comment follows all stages; success replaces only the bot eyes with thumbs up', async () => {
  const f = fixture();
  for (const phase of ['received', 'testing', 'deploying', 'verifying']) {
    await notify({ ...f, phase, deploymentUrl: 'https://candidate.vercel.app' });
    if (phase === 'deploying') assert.match(f.state.comments[0].body, /デプロイを開始します/);
  }
  await notify({ ...f, phase: 'complete', results: { authorize: 'success', test: 'success', deploy: 'success' }, deploymentUrl: 'https://candidate.vercel.app' });
  assert.equal(f.state.creates, 1);
  assert.match(f.state.comments[0].body, /デプロイと検証が完了/);
  assert.match(f.state.comments[0].body, /\[公開先を開く\]\(https:\/\/candidate.vercel.app\)/);
  assert.ok(f.state.reactions.some(reaction => reaction.content === '+1'));
  assert.ok(f.state.reactions.some(reaction => reaction.content === 'eyes' && reaction.user.login === 'human'));
  assert.ok(!f.state.reactions.some(reaction => reaction.content === 'eyes' && reaction.user.login === 'github-actions[bot]'));
});

test('CI rejection reports failure and skipped jobs without a false success', async () => {
  const f = fixture();
  await notify({ ...f, phase: 'complete', results: { authorize: 'failure', test: 'skipped', deploy: 'skipped' } });
  assert.match(f.state.comments[0].body, /要求・CI確認: 失敗/);
  assert.match(f.state.comments[0].body, /事前テスト: 未実行/);
  assert.doesNotMatch(f.state.comments[0].body, /✅|デプロイを開始します/);
  assert.ok(f.state.reactions.some(reaction => reaction.content === 'confused'));
});

test('PR status exposes only curated preflight reasons, never arbitrary failure text', async () => {
  const f = fixture();
  await notify({ ...f, phase: 'complete', results: { authorize: 'success', test: 'success', deploy: 'failure' }, failureCode: 'MAPS_KEY_MISSING' });
  assert.match(f.state.comments[0].body, /MAPS_KEY_MISSING/);
  assert.match(f.state.comments[0].body, /Preview/);
  const unsafe = renderStatus(f.context, 'complete', { deploy: 'failure' }, [], undefined, 'token=private-value');
  assert.doesNotMatch(unsafe.body, /private-value/);
});

test('missing settings reports every name, distinguishes variables from secrets, never their values', () => {
  const env = { VERCEL_PROJECT_ID: 'prj_private', VERCEL_TOKEN: 'sensitive-token', DEPLOY_API_URL: ' ' };
  assert.deepEqual(missingSettings(env), ['VERCEL_ORG_ID', 'DEPLOY_API_URL', 'DEPLOY_APP_ORIGIN']);
  const message = settingsMessage([...missingSettings({}), 'malicious-secret-value'], 'staging', 'https://github.com/owner/repo');
  assert.match(message, /Environment secrets: `VERCEL_TOKEN`/);
  assert.match(message, /Environment variables: `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`/);
  assert.doesNotMatch(message, /prj_private|sensitive-token|malicious-secret-value/);
  const f = fixture();
  const status = renderStatus(f.context, 'complete', { authorize: 'success', test: 'success', deploy: 'failure' }, ['VERCEL_ORG_ID', 'VERCEL_TOKEN']);
  assert.match(status.body, /settings\/environments/);
  assert.match(status.body, /VERCEL_ORG_ID/);
});

test('only staging preview may defer its Origin until the candidate URL exists', async () => {
  const staging = { DEPLOY_ENVIRONMENT: 'staging', TARGET: 'preview' };
  assert.ok(!missingSettings(staging).includes('DEPLOY_APP_ORIGIN'));
  assert.equal(reviewedOrigin(staging), null);
  for (const env of [{}, { DEPLOY_ENVIRONMENT: 'production', TARGET: 'production' },
    { DEPLOY_ENVIRONMENT: 'staging', TARGET: 'production' }, { TARGET: 'preview' }]) {
    assert.throws(() => reviewedOrigin(env), /required for production/);
  }
  assert.ok(missingSettings({ DEPLOY_ENVIRONMENT: 'production' }).includes('DEPLOY_APP_ORIGIN'));
  assert.throws(() => reviewedOrigin({ ...staging, DEPLOY_APP_ORIGIN: 'http://localhost' }), /HTTPS/);
  const calls = [];
  await probeApiReads('https://api.real-domain.com/api', undefined, async (url, options) => {
    calls.push(options);
    return new Response(JSON.stringify(url.endsWith('/health') ? { status: 'ok' } : []), { headers: { 'content-type': 'application/json' } });
  });
  assert.equal(calls.length, 3);
  assert.ok(calls.every(options => !options.headers.Origin && !options.method));
  await assert.rejects(probeApi('https://api.real-domain.com/api', 'https://candidate.vercel.app', async () =>
    new Response(JSON.stringify({ status: 'ok' }), { headers: { 'content-type': 'application/json' } })), /CORS/);
});

test('notification API 403 keeps the run link and sanitized summary; reaction failure still tries the comment', async () => {
  const f = fixture();
  f.github.rest.reactions.createForIssueComment = async () => { throw Object.assign(new Error('token=never-print-this'), { status: 403 }); };
  const first = await notify({ ...f, phase: 'received' });
  assert.equal(first.notified, true);
  f.github.rest.issues.updateComment = async () => { throw Object.assign(new Error('token=never-print-this'), { status: 403 }); };
  const failed = await notify({ ...f, phase: 'complete', results: { authorize: 'failure' } });
  assert.equal(failed.notified, false);
  assert.match(failed.body, /actions\/runs\/501/);
  assert.match(f.state.warnings.join('\n'), /403|pull-requests: write/);
  assert.doesNotMatch(f.state.warnings.join('\n'), /never-print-this/);
});

test('do not edit user or other bot comments with forged status markers; isolate separate runs', async () => {
  const f = fixture();
  const marker = renderStatus(f.context, 'received').marker;
  f.state.comments.push({ id: 999, user: { login: 'attacker' }, body: marker + '\nforged' });
  await notify({ ...f, phase: 'received' });
  assert.equal(f.state.comments[0].body, marker + '\nforged');
  f.context.runId = 502;
  await notify({ ...f, phase: 'received' });
  assert.equal(f.state.creates, 2);
});

test('unauthorized actors, bot comments, edited events and non-PRs cannot post status', async () => {
  for (const change of [f => { f.state.permission = 'read'; }, f => { f.context.payload.comment.user.type = 'Bot'; },
    f => { f.context.payload.action = 'edited'; }, f => { delete f.context.payload.issue.pull_request; }]) {
    const f = fixture(); change(f);
    const result = await notify({ ...f, phase: 'received' });
    assert.equal(result.skipped, true);
    assert.equal(f.state.creates, 0);
  }
});

test('malformed commands and arbitrary deployment URLs cannot inject links or text into status', () => {
  const f = fixture();
  f.context.payload.comment.body = '/deploy staging [click](https://evil.invalid) --verified';
  const status = renderStatus(f.context, 'received', {}, [], 'https://candidate.vercel.app.evil.invalid');
  assert.doesNotMatch(status.body, /evil.invalid|\[click\]/);
  assert.match(status.body, /40桁/);
});

test('notification jobs explicitly request PR write permission while preserving deployment authorization', () => {
  const workflow = readFileSync(resolve(__dirname, '../../.github/workflows/deploy.yml'), 'utf8');
  for (const job of ['authorize', 'deploy', 'report']) {
    const block = workflow.split(`\n  ${job}:\n`)[1].split(/\n  [a-z-]+:\n/)[0];
    assert.match(block, /pull-requests: write/);
    assert.match(block, /issues: write/);
  }
  assert.match(workflow, /always\(\).*github.event.issue.pull_request/);
  assert.match(workflow, /MISSING_SETTINGS: \$\{\{ needs.deploy.outputs.missing_settings \}\}/);
  assert.match(workflow, /Revalidate main and CI before upload/);
  assert.match(workflow, /Final authorization check before promotion/);
});
