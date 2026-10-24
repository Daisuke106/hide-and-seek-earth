'use strict';

const MARKER = '<!-- dependabot-security-auto-approval:v1 -->';
const BOT = 'dependabot[bot]';
const REVIEWER = 'github-actions[bot]';
const OWN_CHECK = 'Dependabot Security Review';
const REQUIRED = {
  '.github/workflows/ci-simple.yml': ['Backend Tests', 'Frontend Tests', 'Basic Security Checks', 'Root NPM Build and Audit'],
  '.github/workflows/ci.yml': ['Backend Tests (PHP 8.5.12)', 'Frontend Tests', 'Code Quality', 'Integration Tests'],
  '.github/workflows/security.yml': ['Composer Security Audit', 'NPM Security Audit', 'PHP Static Analysis', 'Dependency Security Check', 'Secrets Scanning'],
};
const FILES = new Set(['package.json', 'package-lock.json', 'hns-frontend/package.json', 'hns-frontend/package-lock.json', 'composer.json', 'composer.lock']);

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}
function manifestSafe(before, after, composer) {
  const allowed = composer ? ['require', 'require-dev'] : ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];
  const strip = (data) => Object.fromEntries(Object.entries(data).filter(([key]) => !allowed.includes(key)));
  return JSON.stringify(canonical(strip(before))) === JSON.stringify(canonical(strip(after)));
}
function versions(data, composer) {
  if (composer) return new Map([...(data.packages || []), ...(data['packages-dev'] || [])].map((p) => [p.name, { name: p.name, version: p.version }]));
  if (!data.packages || data.lockfileVersion < 2) throw new Error('Unsupported npm lock format');
  return new Map(Object.entries(data.packages).filter(([key, p]) => key.includes('node_modules/') && !p.link).map(([key, p]) => [key, {
    name: p.name || key.slice(key.lastIndexOf('node_modules/') + 13), version: p.version,
  }]));
}
function normalize(version) {
  if (typeof version !== 'string' || !/^v?\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) throw new Error('Version cannot be verified against advisories');
  return version.replace(/^v/, '');
}
function changes(before, after, composer) {
  const old = versions(before, composer), next = versions(after, composer);
  const changedNames = new Set();
  const previous = new Set();
  for (const key of new Set([...old.keys(), ...next.keys()])) {
    const a = old.get(key), b = next.get(key);
    if (a?.name === b?.name && a?.version === b?.version) continue;
    if (a) { changedNames.add(a.name); previous.add(`${a.name}@${normalize(a.version)}`); }
    if (b) changedNames.add(b.name);
  }
  // Check every surviving version of changed packages, including nested copies.
  const current = new Set([...next.values()].filter((p) => changedNames.has(p.name)).map((p) => `${p.name}@${normalize(p.version)}`));
  return { previous: [...previous], current: [...current] };
}
async function jsonFile(github, repo, path, ref) {
  const { data } = await github.rest.repos.getContent({ ...repo, path, ref });
  if (data.type !== 'file' || data.encoding !== 'base64' || typeof data.content !== 'string') throw new Error(`Cannot read ${path}`);
  return JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
}
async function advisories(github, ecosystem, packages) {
  const found = new Map();
  for (let i = 0; i < packages.length; i += 40) {
    const results = await github.paginate('GET /advisories', {
      ecosystem, affects: packages.slice(i, i + 40).join(','), type: 'reviewed', is_withdrawn: false, per_page: 100,
    });
    for (const advisory of results) if (!advisory.withdrawn_at) found.set(advisory.ghsa_id, advisory);
  }
  return [...found.keys()];
}
async function securityFixes(github, repo, pr, files) {
  const fixed = new Set();
  for (const path of files.map((f) => f.filename).filter((path) => path.endsWith('package-lock.json') || path === 'composer.lock')) {
    const composer = path === 'composer.lock';
    const before = await jsonFile(github, repo, path, pr.base.sha);
    const after = await jsonFile(github, repo, path, pr.head.sha);
    const delta = changes(before, after, composer);
    const previous = await advisories(github, composer ? 'composer' : 'npm', delta.previous);
    const current = await advisories(github, composer ? 'composer' : 'npm', delta.current);
    if (current.length) return { ids: [], reason: '更新対象に既知の脆弱性が残っています' };
    previous.forEach((id) => fixed.add(id));
  }
  return { ids: [...fixed], reason: fixed.size ? '' : '公開アドバイザリでセキュリティ修正を確認できません（通常更新は対象外）' };
}
async function workflowsPassed(github, repo, pr) {
  const runs = await github.paginate(github.rest.actions.listWorkflowRunsForRepo, { ...repo, head_sha: pr.head.sha, event: 'pull_request', per_page: 100 });
  const selected = [];
  for (const [path, expected] of Object.entries(REQUIRED)) {
    const run = runs.filter((r) => r.path?.split('@')[0] === path && r.head_sha === pr.head.sha && r.pull_requests?.some((p) => p.number === pr.number))
      .sort((a, b) => b.id - a.id || b.run_attempt - a.run_attempt)[0];
    if (!run || run.status !== 'completed' || run.conclusion !== 'success') return { reason: `${path}が未実行・実行中・失敗です` };
    const jobs = await github.paginate(github.rest.actions.listJobsForWorkflowRun, { ...repo, run_id: run.id, filter: 'latest', per_page: 100 });
    if (expected.some((name) => !jobs.some((j) => j.name === name)) || jobs.some((j) => j.status !== 'completed' || j.conclusion !== 'success')) return { reason: `${path}の必須ジョブが未成功・スキップです` };
    selected.push(run.id);
  }
  const checks = await github.paginate(github.rest.checks.listForRef, { ...repo, ref: pr.head.sha, filter: 'latest', per_page: 100 });
  const external = checks.filter((c) => !(c.name === OWN_CHECK && c.app?.slug === 'github-actions'));
  if (external.some((c) => c.status !== 'completed' || (c.conclusion !== 'success' && !(c.name === 'CodeQL' && c.conclusion === 'neutral')))) return { reason: '追加のチェックが未完了または未成功です' };
  const { data: status } = await github.rest.repos.getCombinedStatusForRef({ ...repo, ref: pr.head.sha });
  if (status.statuses.some((s) => s.state !== 'success')) return { reason: 'コミットステータスが未成功です' };
  return { runs: selected };
}
async function evaluate({ github, repo, pr, reviews }) {
  if (pr.state !== 'open' || pr.draft || pr.user.login !== BOT || pr.head.repo?.full_name !== `${repo.owner}/${repo.repo}` || !pr.head.ref.startsWith('dependabot/') || pr.base.ref !== 'main') return { reason: '対象外のPRです' };
  if (pr.mergeable !== true) return { reason: '競合またはマージ可否未確定です' };
  const { data: main } = await github.rest.repos.getBranch({ ...repo, branch: 'main' });
  if (pr.base.sha !== main.commit.sha) return { reason: 'PRのbase情報が現在のmainと一致しません' };
  const { data: comparison } = await github.rest.repos.compareCommitsWithBasehead({ ...repo, basehead: `${pr.base.sha}...${pr.head.sha}` });
  if (comparison.status !== 'ahead') return { reason: '最新mainを取り込んでいません' };
  const latest = new Map();
  for (const review of [...reviews].sort((a, b) => a.id - b.id)) if (review.state !== 'COMMENTED') latest.set(review.user.login, review.state);
  if ([...latest.values()].includes('CHANGES_REQUESTED')) return { reason: '変更要求レビューが残っています' };
  const commits = await github.paginate(github.rest.pulls.listCommits, { ...repo, pull_number: pr.number, per_page: 100 });
  if (!commits.length || commits.some((c) => c.author?.login !== BOT || c.committer?.login !== 'web-flow' || c.commit?.verification?.verified !== true)) return { reason: 'Dependabot以外または未署名のコミットが含まれています' };
  const files = await github.paginate(github.rest.pulls.listFiles, { ...repo, pull_number: pr.number, per_page: 100 });
  if (!files.length || files.some((f) => f.status !== 'modified' || !FILES.has(f.filename))) return { reason: '依存定義・ロックファイル以外の変更があります' };
  for (const file of files.filter((f) => f.filename.endsWith('package.json') || f.filename === 'composer.json')) {
    const before = await jsonFile(github, repo, file.filename, pr.base.sha);
    const after = await jsonFile(github, repo, file.filename, pr.head.sha);
    if (!manifestSafe(before, after, file.filename === 'composer.json')) return { reason: 'スクリプト・権限等の依存定義以外の変更があります' };
  }
  const ci = await workflowsPassed(github, repo, pr);
  if (ci.reason) return ci;
  const fixes = await securityFixes(github, repo, pr, files);
  if (!fixes.ids.length) return { reason: fixes.reason };
  return { approved: true, ids: fixes.ids, runs: ci.runs };
}
async function revoke({ github, repo, reviews, dryRun, core }) {
  for (const review of reviews.filter((r) => r.user.login === REVIEWER && r.state === 'APPROVED' && r.body?.includes(MARKER))) {
    core.info(`自動承認を取り消します: review ${review.id}${dryRun ? '（dry-run）' : ''}`);
    if (!dryRun) await github.rest.pulls.dismissReview({ ...repo, pull_number: review.pull_number, review_id: review.id, message: '承認条件が未達またはコミットが更新されたため、自動承認を取り消しました。' });
    review.state = 'DISMISSED';
  }
}
async function run({ github, context, core, dryRun = false, number }) {
  const repo = context.repo;
  const candidates = number ? [{ number }] : await github.paginate(github.rest.pulls.list, { ...repo, state: 'open', base: 'main', per_page: 100 });
  for (const candidate of candidates) {
    const { data: pr } = await github.rest.pulls.get({ ...repo, pull_number: candidate.number });
    if (pr.user.login !== BOT) continue;
    if (context.eventName === 'workflow_run' && pr.head.sha !== context.payload.workflow_run.head_sha) continue;
    const reviews = (await github.paginate(github.rest.pulls.listReviews, { ...repo, pull_number: pr.number, per_page: 100 })).map((r) => ({ ...r, pull_number: pr.number }));
    try {
      // Immediately remove this automation's approval of a previous commit.
      await revoke({ github, repo, reviews: reviews.filter((r) => r.commit_id !== pr.head.sha), dryRun, core });
      const result = await evaluate({ github, repo, pr, reviews });
      if (!result.approved) {
        await revoke({ github, repo, reviews: reviews.filter((r) => r.commit_id === pr.head.sha), dryRun, core });
        core.info(`#${pr.number}: 承認見送り — ${result.reason}`);
        continue;
      }
      if (reviews.some((r) => r.user.login === REVIEWER && r.state === 'APPROVED' && r.commit_id === pr.head.sha && r.body?.includes(MARKER))) { core.info(`#${pr.number}: 承認済み`); continue; }
      const { data: current } = await github.rest.pulls.get({ ...repo, pull_number: pr.number });
      const { data: liveMain } = await github.rest.repos.getBranch({ ...repo, branch: 'main' });
      if (current.head.sha !== pr.head.sha || current.base.sha !== pr.base.sha || liveMain.commit.sha !== pr.base.sha || current.state !== 'open' || current.draft || current.mergeable !== true) { core.info(`#${pr.number}: 判定中にPRまたはmainが変更されました`); continue; }
      // Recheck live CI immediately before attaching approval to the exact SHA.
      const finalChecks = await workflowsPassed(github, repo, current);
      if (finalChecks.reason) { await revoke({ github, repo, reviews, dryRun, core }); core.info(finalChecks.reason); continue; }
      core.info(`#${pr.number}: セキュリティ修正確認 ${result.ids.join(', ')}${dryRun ? '（dry-run・承認しません）' : ''}`);
      if (!dryRun) {
        const { data: created } = await github.rest.pulls.createReview({ ...repo, pull_number: pr.number, commit_id: pr.head.sha, event: 'APPROVE', body: `${MARKER}\n署名済みDependabot更新、変更範囲、最新main、必須CIと追加チェックの成功を確認しました。\n修正対象: ${result.ids.join(', ')}\n確認コミット: ${pr.head.sha}\n自動マージは行いません。` });
        reviews.push({ id: created.id, state: 'APPROVED', user: { login: REVIEWER }, body: MARKER, commit_id: pr.head.sha, pull_number: pr.number });
        const { data: after } = await github.rest.pulls.get({ ...repo, pull_number: pr.number });
        const { data: afterMain } = await github.rest.repos.getBranch({ ...repo, branch: 'main' });
        if (after.head.sha !== pr.head.sha || after.base.sha !== pr.base.sha || afterMain.commit.sha !== pr.base.sha || after.state !== 'open' || after.draft) {
          await revoke({ github, repo, reviews, dryRun, core });
          core.info(`#${pr.number}: 承認中にPRが変更されたため取り消しました`);
        }
      }
    } catch (error) {
      await revoke({ github, repo, reviews, dryRun, core });
      core.setFailed(`#${pr.number}: 判定に失敗したため承認しません: ${error.message}`);
    }
  }
}
module.exports = { run, evaluate, changes, manifestSafe, workflowsPassed, MARKER, REQUIRED };
