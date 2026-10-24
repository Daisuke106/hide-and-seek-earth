'use strict';

// This policy is loaded only from the trusted default branch, never a PR head.
const REQUIRED = {
  'ci.yml': ['Backend Tests (PHP 8.5.12)', 'Frontend Tests', 'Code Quality', 'Integration Tests'],
  'ci-simple.yml': ['Backend Tests', 'Frontend Tests', 'Basic Security Checks', 'Root NPM Build and Audit'],
  'security.yml': ['Composer Security Audit', 'NPM Security Audit', 'PHP Static Analysis', 'Secrets Scanning'],
};

function parseCommand(body) {
  const match = /^\/deploy (staging|production) ([a-f0-9]{40}) --verified$/.exec(body.trim());
  if (!match) throw new Error('Use: /deploy staging|production <40-character main SHA> --verified');
  return { environment: match[1], sha: match[2] };
}

async function authorize({ github, context, now = Date.now() }) {
  const { payload, repo } = context;
  if (context.eventName !== 'issue_comment' || payload.action !== 'created' || !payload.issue?.pull_request) {
    throw new Error('A newly created PR comment is required');
  }
  if (payload.repository.default_branch !== 'main') throw new Error('Default branch must be main');
  const original = payload.comment;
  const command = parseCommand(original.body);
  if (original.user.type !== 'User') throw new Error('Bot commands are not allowed');
  const permission = await github.rest.repos.getCollaboratorPermissionLevel({ ...repo, username: original.user.login });
  if (!['admin', 'maintain', 'write'].includes(permission.data.permission)) throw new Error('Write permission is required');
  const { data: current } = await github.rest.issues.getComment({ ...repo, comment_id: original.id });
  if (current.body !== original.body || current.user.id !== original.user.id || current.updated_at !== current.created_at) {
    throw new Error('Edited or replaced comments cannot authorize deployment');
  }
  const age = now - Date.parse(current.created_at);
  if (!Number.isFinite(age) || age < 0 || age > 24 * 60 * 60 * 1000) throw new Error('Command expired; post a new comment');
  const { data: pr } = await github.rest.pulls.get({ ...repo, pull_number: payload.issue.number });
  if (!pr.merged || pr.base.ref !== 'main' || pr.base.repo.full_name !== `${repo.owner}/${repo.repo}` || pr.merge_commit_sha !== command.sha) {
    throw new Error('Only the exact merge commit of a PR merged into this repository main is allowed');
  }
  const { data: branch } = await github.rest.repos.getBranch({ ...repo, branch: 'main' });
  if (branch.commit.sha !== command.sha || context.sha !== command.sha) throw new Error('main changed; review the latest PR and post a new command');

  for (const [workflow, required] of Object.entries(REQUIRED)) {
    const runs = await github.paginate(github.rest.actions.listWorkflowRuns, {
      ...repo, workflow_id: workflow, head_sha: command.sha, event: 'push', branch: 'main', per_page: 100,
    });
    const run = runs.filter(r => r.head_sha === command.sha && r.event === 'push' && r.head_branch === 'main' &&
      r.head_repository?.full_name === `${repo.owner}/${repo.repo}`).sort((a, b) => b.id - a.id)[0];
    if (!run || run.status !== 'completed' || run.conclusion !== 'success') throw new Error(`Latest ${workflow} must succeed on this main SHA`);
    const jobs = await github.paginate(github.rest.actions.listJobsForWorkflowRun, { ...repo, run_id: run.id, filter: 'latest', per_page: 100 });
    for (const name of required) {
      const job = jobs.find(j => j.name === name);
      if (!job || job.status !== 'completed' || job.conclusion !== 'success') throw new Error(`Required job did not succeed: ${name}`);
    }
  }

  if (command.environment === 'production') {
    const runs = await github.paginate(github.rest.actions.listWorkflowRuns, {
      ...repo, workflow_id: 'deploy.yml', head_sha: command.sha, event: 'issue_comment', branch: 'main', per_page: 100,
    });
    let verified = false;
    for (const run of runs.filter(r => r.id !== context.runId && r.head_sha === command.sha && r.event === 'issue_comment' &&
      r.head_repository?.full_name === `${repo.owner}/${repo.repo}` && r.status === 'completed' && r.conclusion === 'success' &&
      Date.parse(r.updated_at) <= Date.parse(current.created_at))) {
      const jobs = await github.paginate(github.rest.actions.listJobsForWorkflowRun, { ...repo, run_id: run.id, filter: 'latest', per_page: 100 });
      if (jobs.some(j => j.name === 'Deploy staging' && j.conclusion === 'success')) verified = true;
    }
    if (!verified) throw new Error('Successfully deploy this SHA to staging and verify it before posting the production command');
  }
  return command;
}

module.exports = { REQUIRED, parseCommand, authorize };
