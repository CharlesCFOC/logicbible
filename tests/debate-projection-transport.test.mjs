import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

function bridge({ signedIn = true, response, rejectFetch = false } = {}) {
  const requests = [];
  const context = vm.createContext({
    Headers,
    window: { location: { hostname: 'localhost', port: '4000' } },
    supabaseClient: signedIn ? { auth: { getSession: async () => ({ data: { session: { access_token: 'current-token' } } }) } } : null,
    fetch: async (...args) => { requests.push(args); if (rejectFetch) throw new TypeError('Failed to fetch'); return response; },
  });
  for (const file of ['scripts/core/api.js', 'scripts/bridges/ai.js']) vm.runInContext(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'), context);
  context.installAiBridge();
  return { api: context.window.aiBridge, requests };
}

test('projection creation sends the signed-in token and returns the link credentials only on a valid response', async () => {
  const result = { token: 'public-token', controlToken: 'private-controller-token', expiresAt: Date.now() + 1000 };
  const { api, requests } = bridge({ response: { ok: true, status: 201, json: async () => result } });
  assert.equal(await api.createDebateProjection({ version: 1 }), result);
  assert.equal(requests[0][0], '/api/debate/projection');
  assert.equal(requests[0][1].headers.get('Authorization'), 'Bearer current-token');
  assert.deepEqual(JSON.parse(requests[0][1].body), { action: 'create', state: { version: 1 } });
});

test('projection creation provides actionable errors for missing login, an old server and a broken connection', async () => {
  const signedOut = bridge({ signedIn: false });
  await assert.rejects(signedOut.api.createDebateProjection({}), error => error.status === 401 && /Connectez-vous/.test(error.message));
  assert.equal(signedOut.requests.length, 0, 'signed-out creation does not reach the API');
  const expired = bridge({ response: { status: 401, json: async () => ({ error: 'expired' }) } });
  await assert.rejects(expired.api.createDebateProjection({}), error => error.status === 401 && /Reconnectez-vous/.test(error.message));
  const oldServer = bridge({ response: { status: 404, json: async () => ({ error: 'API route not found.' }) } });
  await assert.rejects(oldServer.api.createDebateProjection({}), /version locale à jour/);
  const offline = bridge({ rejectFetch: true });
  await assert.rejects(offline.api.createDebateProjection({}), /connexion au service de projection/);
  for (const response of [
    { ok: false, status: 502, json: async () => { throw new SyntaxError('Unexpected token <'); } },
    { ok: true, status: 200, json: async () => ({}) },
  ]) {
    await assert.rejects(bridge({ response }).api.createDebateProjection({}), /Le lien n’a pas pu être créé/);
  }
});
