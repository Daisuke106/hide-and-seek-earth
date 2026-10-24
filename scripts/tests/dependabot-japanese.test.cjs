const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const workflow = fs.readFileSync(
  path.join(__dirname, '../../.github/workflows/dependabot-japanese.yml'),
  'utf8'
);
const source = workflow.split('          script: |\n')[1]
  .split('\n').map((line) => line.replace(/^ {12}/, '')).join('\n');
const execute = new (Object.getPrototypeOf(async function () {}).constructor)(
  'github', 'context', source
);
const makePr = (overrides = {}) => ({
  number: 42, state: 'open', user: { login: 'dependabot[bot]' },
  head: { repo: { full_name: 'owner/repo' } },
  title: 'npm(deps): bump example from 1.0.0 to 1.0.1 in /frontend',
  body: 'Original release notes\n\n@dependabot rebase', ...overrides,
});
async function localize(pr) {
  const updates = [];
  await execute({ rest: { pulls: {
    get: async () => ({ data: pr }),
    update: async (update) => updates.push(update),
  } } }, { repo: { owner: 'owner', repo: 'repo' }, payload: { pull_request: { number: pr.number } } });
  return updates;
}

test('single update is Japanese, preserves source, and is idempotent', async () => {
  const pr = makePr();
  const [update] = await localize(pr);
  assert.equal(update.title, '[依存関係更新] exampleを1.0.0から1.0.1へ更新（/frontend）');
  assert.ok(update.body.endsWith(pr.body));
  assert.deepEqual(await localize({ ...pr, ...update }), []);
});
test('groups and refreshed Dependabot descriptions are supported', async () => {
  const pr = makePr({ title: 'Bump the react group across 1 directory with 6 updates' });
  const [update] = await localize(pr);
  assert.equal(update.title, '[依存関係更新] reactグループの依存関係6件を更新');
  const [refreshed] = await localize({ ...pr, ...update, title: 'Bump the react group with 7 updates' });
  assert.match(refreshed.title, /7件/);
  assert.equal((refreshed.body.match(/## 更新概要/g) || []).length, 1);
});
test('human authors, forks and closed PRs are never changed', async () => {
  for (const overrides of [{ user: { login: 'human' } }, { head: { repo: { full_name: 'fork/repo' } } }, { state: 'closed' }]) {
    assert.deepEqual(await localize(makePr(overrides)), []);
  }
});
test('long release notes are preserved and title input is treated as data', async () => {
  const [update] = await localize(makePr({ body: 'x'.repeat(65000) }));
  assert.equal(update.body, undefined);
  assert.deepEqual(await localize(makePr({ ...update, body: 'x'.repeat(65000) })), []);
  global.__localizationInjected = false;
  await localize(makePr({ title: 'bump ${global.__localizationInjected=true} from 1 to 2' }));
  assert.equal(global.__localizationInjected, false);
  delete global.__localizationInjected;
});
