'use strict';

const { parseCommand } = require('./vercel-deploy-policy.cjs');

const VARIABLES = ['VERCEL_ORG_ID', 'VERCEL_PROJECT_ID', 'DEPLOY_API_URL', 'DEPLOY_APP_ORIGIN'];
const SECRETS = ['VERCEL_TOKEN'];
const PHASES = {
  received: '👀 デプロイ要求を受け付けました。公開の許可条件を確認しています。',
  testing: '🔍 デプロイ前のテストとセキュリティ監査を実行しています。環境の承認が必要な場合は、その承認も待機します。',
  deploying: '🚀 デプロイを開始します。設定確認後、ビルドとアップロードを実行します。',
  verifying: '🔍 公開候補を作成しました。画面・API・CORSの動作を検証しています。',
};

function missingSettings(env) {
  return [...VARIABLES, ...SECRETS].filter(name =>
    !(name === 'DEPLOY_APP_ORIGIN' && env.DEPLOY_ENVIRONMENT === 'staging') && !env[name]?.trim());
}

function settingsMessage(missing, environment, repoUrl) {
  const names = missing.filter(name => [...VARIABLES, ...SECRETS].includes(name));
  const target = environment === 'production' ? 'production' : 'staging';
  const lines = [`GitHub Environment「${target}」に設定が不足しています。`];
  for (const [label, keys] of [['Environment variables', VARIABLES], ['Environment secrets', SECRETS]]) {
    const absent = names.filter(name => keys.includes(name));
    if (absent.length) lines.push(`- ${label}: ${absent.map(name => `\`${name}\``).join(', ')}`);
  }
  lines.push(`[設定画面](${repoUrl}/settings/environments) → ${target} に登録してください。値やトークンをPRコメントへ貼る必要はありません。`);
  return lines.join('\n');
}

function renderStatus(context, phase, results = {}, missing = [], deploymentUrl) {
  const repoUrl = `${context.serverUrl}/${context.repo.owner}/${context.repo.repo}`;
  const runUrl = `${repoUrl}/actions/runs/${context.runId}`;
  const marker = `<!-- vercel-deploy-status:${context.runId}:${context.payload.comment.id} -->`;
  let command;
  try { command = parseCommand(context.payload.comment.body); } catch { /* Do not echo untrusted commands. */ }
  const complete = phase === 'complete';
  const ok = complete && ['authorize', 'test', 'deploy'].every(job => results[job] === 'success');
  const lines = [marker, complete
    ? (ok ? '✅ デプロイと検証が完了しました。' : '❌ デプロイ要求は完了していません。本番への切り替え成功は確認されていません。')
    : PHASES[phase], '', `進行状況はこちらから → [GitHub Actionsのログを開く](${runUrl})`];
  if (!complete && !PHASES[phase]) throw new Error('Unknown deployment notification phase');
  if (command) lines.push('', `対象: **${command.environment}** / コミット: \`${command.sha}\``);
  else lines.push('', 'コマンドは `/deploy staging|production <40桁のSHA> --verified` の1行で新規投稿してください。');
  if (complete && !ok) {
    const labels = { authorize: '要求・CI確認', test: '事前テスト', deploy: 'デプロイ・動作検証' };
    const states = { success: '成功', failure: '失敗', skipped: '未実行', cancelled: 'キャンセル' };
    lines.push('', ...Object.keys(labels).map(job => `- ${labels[job]}: ${states[results[job]] || '未完了'}`));
    if (missing.length) lines.push('', settingsMessage(missing, command?.environment, repoUrl));
    else lines.push('', '停止理由は上記ログの失敗したステップで確認できます。CI待ちで停止した場合は、成功後に新しいコメントで再要求してください。');
  }
  // Only link a candidate URL produced by our Vercel CLI step, never arbitrary input.
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(deploymentUrl || '')) {
    lines.push('', `[${ok ? '公開先を開く' : '公開候補を開く（検証状況はログを確認）'}](${deploymentUrl})`);
  }
  return { marker, body: lines.join('\n'), complete, reaction: complete ? (ok ? '+1' : 'confused') : 'eyes' };
}

async function notify({ github, context, phase, results, missing, deploymentUrl, warn = () => {} }) {
  const request = context.payload.comment;
  if (context.eventName !== 'issue_comment' || context.payload.action !== 'created' ||
      !context.payload.issue?.pull_request || request?.user?.type !== 'User' || !request.body.startsWith('/deploy ')) return { skipped: true };
  const status = renderStatus(context, phase, results, missing, deploymentUrl);
  const warning = (operation, error) => warn(`${operation}を通知できませんでした (HTTP ${Number(error.status) || '不明'})。通知ジョブのpull-requests: write / issues: write権限を確認してください。ActionsのSummaryにも進行状況を記録します。`);
  try {
    const permission = await github.rest.repos.getCollaboratorPermissionLevel({ ...context.repo, username: request.user.login });
    if (!['write', 'maintain', 'admin'].includes(permission.data.permission)) return { skipped: true };
  } catch (error) {
    warning('要求者の権限確認', error);
    return { ...status, notified: false };
  }
  const commentParams = { ...context.repo, comment_id: request.id };
  try {
    if (status.complete) {
      const reactions = await github.paginate(github.rest.reactions.listForIssueComment, { ...commentParams, per_page: 100 });
      for (const reaction of reactions.filter(item => item.content === 'eyes' && item.user?.login === 'github-actions[bot]')) {
        await github.rest.reactions.deleteForIssueComment({ ...commentParams, reaction_id: reaction.id });
      }
    }
    await github.rest.reactions.createForIssueComment({ ...commentParams, content: status.reaction });
  } catch (error) { warning('リアクション', error); }
  try {
    const comments = await github.paginate(github.rest.issues.listComments, { ...context.repo, issue_number: context.issue.number, per_page: 100 });
    const existing = comments.find(comment => comment.user?.login === 'github-actions[bot]' && comment.body?.startsWith(status.marker + '\n'));
    if (existing) await github.rest.issues.updateComment({ ...context.repo, comment_id: existing.id, body: status.body });
    else await github.rest.issues.createComment({ ...context.repo, issue_number: context.issue.number, body: status.body });
    return { ...status, notified: true };
  } catch (error) {
    warning('PRコメント', error);
    return { ...status, notified: false };
  }
}

module.exports = { missingSettings, settingsMessage, renderStatus, notify };
