import assert from 'node:assert/strict';
import { createServer as createHttpServer } from 'node:http';
import { test } from 'node:test';
import { createServer } from 'vite';
import config from '../vite.config.mjs';

test('public environment, SPA routes, assets and API proxy survive migration', async () => {
  const backend = createHttpServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ path: req.url }));
  });
  await new Promise(resolve => backend.listen(0, '127.0.0.1', resolve));
  const originalApi = process.env.REACT_APP_API_URL;
  const originalSecret = process.env.TOOLCHAIN_PRIVATE_SECRET;
  process.env.REACT_APP_API_URL = `http://127.0.0.1:${backend.address().port}/api`;
  process.env.TOOLCHAIN_PRIVATE_SECRET = 'must-never-reach-the-browser';
  let server;
  try {
    const settings = config({ mode: 'development' });
    const browserEnv = JSON.parse(settings.define['process.env']);
    assert.equal(browserEnv.REACT_APP_API_URL, process.env.REACT_APP_API_URL);
    assert.equal(browserEnv.NODE_ENV, 'development');
    assert.equal(browserEnv.TOOLCHAIN_PRIVATE_SECRET, undefined);
    server = await createServer({
      ...settings,
      configFile: false,
      optimizeDeps: { noDiscovery: true, include: [] },
      server: { ...settings.server, host: '127.0.0.1', port: 0 },
    });
    await server.listen();
    const url = `http://127.0.0.1:${server.httpServer.address().port}`;
    const page = await fetch(`${url}/leaderboard`);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /\/src\/index\.tsx/);
    assert.equal((await fetch(`${url}/favicon.ico`)).status, 200);
    const response = await fetch(`${url}/api/leaderboard?limit=5`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      path: '/api/leaderboard?limit=5',
    });
  } finally {
    await server?.close();
    await new Promise(resolve => backend.close(resolve));
    if (originalApi === undefined) delete process.env.REACT_APP_API_URL;
    else process.env.REACT_APP_API_URL = originalApi;
    if (originalSecret === undefined)
      delete process.env.TOOLCHAIN_PRIVATE_SECRET;
    else process.env.TOOLCHAIN_PRIVATE_SECRET = originalSecret;
  }
});
