import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
process.env.VERCEL = '1';
const { default: handler } = await import('../server.mjs');

test('extracted route groups preserve validation and reject invalid requests without external calls', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('Unexpected external request'); };
  try {
    for (const [url, method, body, expected] of [
      ['/api/sessions/create', 'GET', null, 405],
      ['/api/sessions/prepare', 'GET', null, 405],
      ['/api/sessions/segment', 'GET', null, 405],
      ['/api/sessions/generate-activity', 'GET', null, 405],
      ['/api/sessions/start', 'GET', null, 405],
      ['/api/sessions/lookup', 'POST', { accessCode: 'invalid' }, 400],
      ['/api/church/projection', 'GET', null, 400],
      ['/api/account/delete', 'POST', {}, 401],
      ['/api/prayer/intercession-votes', 'POST', {}, 401],
      ['/api/prayer/intercession-journal', 'POST', {}, 405],
      ['/api/bible/chapter', 'GET', null, 400],
      ['/api/original-language', 'GET', null, 400],
    ]) {
      const req = Readable.from(body ? [JSON.stringify(body)] : []);
      Object.assign(req, { url, method, headers: { host: 'localhost' }, socket: { remoteAddress: '127.0.0.1' } });
      const res = { setHeader() {}, writeHead(status) { this.status = status; }, end(body) { this.body = body; } };
      await handler(req, res);
      assert.equal(res.status, expected, `${method} ${url}: ${res.body}`);
    }
  } finally { globalThis.fetch = originalFetch; }
});
