'use strict';
const { readFileSync, writeFileSync } = require('node:fs');
const { parseEnv } = require('node:util');
const { randomBytes, scryptSync, timingSafeEqual } = require('node:crypto');
const { isIP } = require('node:net');

function publicUrl(value, label, originOnly = false) {
  let url;
  try { url = new URL(value); } catch { throw new Error(`${label}: HTTPS URL is required`); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.port ||
    isIP(url.hostname) || !url.hostname.includes('.') || /(?:^|\.)(localhost|local|internal|test|example)(?:\.|$)/i.test(url.hostname)) {
    throw new Error(`${label}: public HTTPS hostname without credentials/query is required`);
  }
  if (originOnly && url.pathname !== '/') throw new Error(`${label}: origin only is required`);
  return url;
}

function validateEnvironment(env, expectedApi) {
  const api = publicUrl(env.REACT_APP_API_URL, 'REACT_APP_API_URL');
  publicUrl(expectedApi, 'DEPLOY_API_URL');
  if (env.REACT_APP_API_URL !== expectedApi || !api.pathname.endsWith('/api')) throw new Error('API URL must match reviewed DEPLOY_API_URL and end in /api');
  if (!/^AIza[\w-]{35}$/.test(env.REACT_APP_GOOGLE_MAPS_API_KEY || '')) throw new Error('A valid-format Google Maps browser key is required');
  const allowed = new Set(['REACT_APP_API_URL', 'REACT_APP_GOOGLE_MAPS_API_KEY']);
  if (Object.keys(env).some(key => /^(REACT_APP_|VITE_|NEXT_PUBLIC_)/.test(key) && !allowed.has(key))) throw new Error('Unexpected browser-public environment variable');
  if (env.PUBLIC_URL && env.PUBLIC_URL !== '/') throw new Error('PUBLIC_URL must be / or unset');
  if (env.APP_DEBUG && env.APP_DEBUG.toLowerCase() !== 'false') throw new Error('APP_DEBUG must not be enabled');
  return api;
}

function validateProject(project, env) {
  if (project.id !== env.VERCEL_PROJECT_ID || project.accountId !== env.VERCEL_ORG_ID) throw new Error('Vercel project/team mismatch');
  if (project.rootDirectory !== 'hns-frontend' || project.framework !== 'vite' || project.nodeVersion !== '22.x') throw new Error('Vercel project must use root hns-frontend, Vite and Node 22.x');
  if (project.link?.deployHooks?.length) throw new Error('Remove Vercel deploy hooks that bypass the approval workflow');
  return {
    id: project.id, accountId: project.accountId, rootDirectory: project.rootDirectory,
    framework: project.framework, nodeVersion: project.nodeVersion,
    buildCommand: project.buildCommand, installCommand: project.installCommand, outputDirectory: project.outputDirectory,
    ssoProtection: project.ssoProtection, passwordProtection: project.passwordProtection,
    trustedIps: project.trustedIps,
  };
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}
function fingerprint(env, settings, salt) {
  if (!Buffer.isBuffer(salt) || salt.length < 32) throw new Error('A random 32-byte review salt is required');
  // Settings may contain passwordProtection. Use a salted, costly KDF even
  // though this value is only a transient configuration-change verifier.
  return scryptSync(JSON.stringify(canonical({
    env: Object.fromEntries(Object.entries(env).filter(([key]) => !key.startsWith('VERCEL_'))), settings,
  })), salt, 64);
}

async function request(url, options = {}, fetcher = fetch) {
  const response = await fetcher(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Deployment check failed (HTTP ${response.status})`);
  return response;
}
async function probeApi(api, origin, fetcher = fetch) {
  publicUrl(api, 'API');
  publicUrl(origin, 'Origin', true);
  for (const endpoint of ['health', 'characters', 'game-sessions/leaderboard']) {
    const response = await request(`${api}/${endpoint}`, { headers: { Origin: origin, Accept: 'application/json' } }, fetcher);
    if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('API must return JSON');
    const data = await response.json();
    if (endpoint === 'health' ? data.status !== 'ok' : !Array.isArray(data) && !Array.isArray(data.data)) throw new Error('API response shape is invalid');
    if (response.headers.get('access-control-allow-origin') !== origin) throw new Error('API CORS must explicitly allow the deployed origin');
  }
  const preflight = await request(`${api}/game-sessions`, {
    method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' },
  }, fetcher);
  if (preflight.headers.get('access-control-allow-origin') !== origin ||
    !/(?:^|[,\s])POST(?:$|[,\s])/i.test(preflight.headers.get('access-control-allow-methods') || '') ||
    !/(?:^|[,\s])content-type(?:$|[,\s])/i.test(preflight.headers.get('access-control-allow-headers') || '')) throw new Error('API POST/CORS preflight failed');
}

async function preflight(mode, processEnv = process.env) {
  const config = JSON.parse(readFileSync('hns-frontend/vercel.json', 'utf8'));
  if (config.git?.deploymentEnabled !== false) throw new Error('Vercel automatic Git deployments must be disabled');
  const env = parseEnv(readFileSync(`.vercel/.env.${processEnv.TARGET}.local`, 'utf8'));
  const api = validateEnvironment(env, processEnv.DEPLOY_API_URL);
  const origin = publicUrl(processEnv.DEPLOY_APP_ORIGIN, 'DEPLOY_APP_ORIGIN', true).origin;
  const response = await request(`https://api.vercel.com/v9/projects/${encodeURIComponent(processEnv.VERCEL_PROJECT_ID)}?teamId=${encodeURIComponent(processEnv.VERCEL_ORG_ID)}`, {
    headers: { Authorization: `Bearer ${processEnv.VERCEL_TOKEN}` },
  });
  const settings = validateProject(await response.json(), processEnv);
  const file = '.vercel/deploy-review.json';
  if (mode === 'record') {
    const salt = randomBytes(32);
    writeFileSync(file, JSON.stringify({ salt: salt.toString('hex'), hash: fingerprint(env, settings, salt).toString('hex'), sha: processEnv.DEPLOY_SHA }), { mode: 0o600 });
  }
  else {
    const before = JSON.parse(readFileSync(file, 'utf8'));
    const hash = fingerprint(env, settings, Buffer.from(before.salt, 'hex'));
    const previous = Buffer.from(before.hash, 'hex');
    if (previous.length !== hash.length || !timingSafeEqual(previous, hash) || before.sha !== processEnv.DEPLOY_SHA) throw new Error('Reviewed Vercel environment/settings changed during the build');
  }
  await probeApi(api.href, origin);
  console.log('PASS: Vercel project, public variables, API reads and CORS');
}

if (require.main === module) preflight(process.argv[2]).catch(() => {
  // Never emit URLs, response bodies or credentials from provider errors.
  console.error('Vercel preflight failed. Check project settings, environment variables, API health and CORS using docs/vercel-deployment.md.');
  process.exitCode = 1;
});
module.exports = { publicUrl, validateEnvironment, validateProject, fingerprint, probeApi, request };
