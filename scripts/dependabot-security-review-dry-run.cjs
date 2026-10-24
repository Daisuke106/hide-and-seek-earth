'use strict';
// Read-only live API adapter: no token is printed, stored, or passed to PR code.
const { execFileSync } = require('node:child_process');
const { run } = require('./dependabot-security-review.cjs');

function query(params) {
  const data = Object.entries(params).filter(([key, value]) => !['owner', 'repo', 'pull_number', 'run_id', 'path', 'basehead', 'ref', 'branch'].includes(key) && value !== undefined);
  return data.length ? `?${new URLSearchParams(data).toString()}` : '';
}
function route(path) { return Object.assign(() => {}, { path }); }
function read(method, params, paginate = false) {
  const path = typeof method === 'string' ? '/advisories' : method.path(params);
  const args = ['api', path + query(params)];
  if (paginate) args.push('--paginate', '--slurp');
  const data = JSON.parse(execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }));
  return paginate ? data.flatMap((page) => Array.isArray(page) ? page : page.workflow_runs || page.jobs || page.check_runs || []) : { data };
}
const prefix = (p) => `/repos/${p.owner}/${p.repo}`;
const pulls = (p) => `${prefix(p)}/pulls/${p.pull_number}`;
const get = (path) => { const method = route(path); return Object.assign((params) => Promise.resolve(read(method, params)), method); };
const forbidden = async () => { throw new Error('Writes are disabled in the live dry-run adapter'); };
const github = { rest: {
  repos: {
    getBranch: get((p) => `${prefix(p)}/branches/${p.branch}`),
    compareCommitsWithBasehead: get((p) => `${prefix(p)}/compare/${p.basehead}`),
    getContent: get((p) => `${prefix(p)}/contents/${p.path}?ref=${encodeURIComponent(p.ref)}`),
    getCombinedStatusForRef: get((p) => `${prefix(p)}/commits/${p.ref}/status`),
  },
  pulls: {
    list: route((p) => `${prefix(p)}/pulls`), get: get(pulls),
    listCommits: route((p) => `${pulls(p)}/commits`), listFiles: route((p) => `${pulls(p)}/files`), listReviews: route((p) => `${pulls(p)}/reviews`),
    createReview: forbidden, dismissReview: forbidden,
  },
  actions: {
    listWorkflowRunsForRepo: route((p) => `${prefix(p)}/actions/runs`),
    listJobsForWorkflowRun: route((p) => `${prefix(p)}/actions/runs/${p.run_id}/jobs`),
  },
  checks: { listForRef: route((p) => `${prefix(p)}/commits/${p.ref}/check-runs`) },
}, paginate: (method, params) => Promise.resolve(read(method, params, true)) };

if (require.main === module) {
  const value = process.argv[2];
  if (value && !/^[1-9][0-9]*$/.test(value)) throw new Error('Use a positive PR number');
  run({ github, context: { repo: { owner: 'Daisuke106', repo: 'hide-and-seek-earth' }, eventName: 'workflow_dispatch', payload: {} },
    core: { info: console.log, setFailed: (message) => { console.error(message); process.exitCode = 1; } },
    dryRun: true, number: value ? Number(value) : undefined,
  }).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { read };
