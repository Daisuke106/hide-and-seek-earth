'use strict';
const { readFileSync } = require('node:fs');
const { parseEnv } = require('node:util');
const { request, publicUrl, probeApi } = require('./vercel-preflight.cjs');

async function smoke(env = process.env, fetcher = fetch) {
  if (!/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(env.DEPLOYMENT_URL || '')) throw new Error('Unexpected deployment URL');
  const origin = publicUrl(env.DEPLOYMENT_URL, 'Deployment', true).origin;
  const headers = env.BYPASS_SECRET ? { 'x-vercel-protection-bypass': env.BYPASS_SECRET } : {};
  for (const path of ['/', '/game', '/leaderboard']) {
    const response = await request(`${origin}${path}`, { headers }, fetcher);
    if (!response.headers.get('content-type')?.includes('text/html') || response.headers.get('x-content-type-options') !== 'nosniff') throw new Error('HTML/security header check failed');
    const html = await response.text();
    if (!/<div id="root"/.test(html)) throw new Error('App root is missing');
    const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(match => new URL(match[1], origin));
    if (!scripts.length) throw new Error('App JavaScript is missing');
    for (const script of scripts) {
      if (script.origin !== origin) throw new Error('Unexpected external app script');
      const asset = await request(script, { headers }, fetcher);
      if (!/javascript/.test(asset.headers.get('content-type') || '')) throw new Error('App script did not load');
    }
  }
  await probeApi(env.DEPLOY_API_URL, origin, fetcher);
  console.log('PASS: deployed SPA routes, JavaScript assets, security headers and API/CORS');
}

if (require.main === module) {
  const env = parseEnv(readFileSync(`.vercel/.env.${process.env.TARGET}.local`, 'utf8'));
  smoke({ ...process.env, DEPLOY_API_URL: env.REACT_APP_API_URL }).catch(() => {
    console.error('Deployment smoke test failed. Production promotion is blocked. Inspect access protection, frontend routes, assets and API CORS.');
    process.exitCode = 1;
  });
}
module.exports = { smoke };
