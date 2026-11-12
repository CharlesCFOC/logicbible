import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createDebateProjectionHandler } from '../lib/routes/debate-projection.js';
import { conversationSlides, initialProjectionState, normalizeProjectionState, projectionPages } from '../src/shared/debate-projection.js';

function memoryAdmin() {
  const rows = new Map();
  return { rows, from(table) {
    assert.equal(table, 'bible_sessions');
    return {
      async insert(row) { rows.set(row.id, structuredClone(row)); return {}; },
      select() { return { eq(field, value) { return { async maybeSingle() { return { data: structuredClone([...rows.values()].find(row => row[field] === value) || null) }; } }; } }; },
      update(changes) { return { async eq(field, value) { for (const row of rows.values()) if (row[field] === value) Object.assign(row, structuredClone(changes)); return {}; } }; },
    };
  } };
}

function request(handler) {
  return async (method, body, token = '', authorization = '') => {
    const req = Readable.from(body ? [JSON.stringify(body)] : []);
    Object.assign(req, { method, url: `/api/debate/projection?token=${token}`, headers: { authorization }, socket: { remoteAddress: 'test-projection' } });
    const res = { headers: {}, setHeader(key, value) { this.headers[key] = value; }, writeHead(status) { this.status = status; }, end(body) { this.body = JSON.parse(body); } };
    try { await handler(req, res); }
    catch (error) { res.status = error.status || 500; res.body = { error: error.message }; }
    return res;
  };
}

test('projection only shares published messages and paginates long answers without dropping text', () => {
  const text = Array.from({ length: 400 }, (_, i) => `mot${i}`).join(' ');
  const state = initialProjectionState({ messages: [{ role: 'assistant', text: 'Question' }, { role: 'user', text }, { role: 'assistant', text: 'Partial', pending: true }] });
  assert.equal(state.messages.length, 2);
  assert.equal(projectionPages(text).join(' '), text);
  const slides = conversationSlides(state.messages);
  assert.equal(slides[state.slideIndex].messageIndex, 1);
  assert.equal(slides[state.slideIndex].page, 1, 'latest response starts at its first page');
  assert.ok(slides.length > 2);
  assert.ok(projectionPages(Array(30).fill('Un point.').join('\n')).length > 2, 'line breaks also count toward the page budget');
  assert.deepEqual(normalizeProjectionState({ ...state, messages: [null, { role: 'user', text: 42 }] }).messages, []);
  const normalized = normalizeProjectionState({ ...state, privateNotes: 'secret', controlToken: 'secret', slideIndex: 100000, focus: 'unknown', reference: { body: '<script>alert(1)</script>' } });
  assert.equal(normalized.privateNotes, undefined);
  assert.equal(normalized.controlToken, undefined);
  assert.equal(normalized.focus, 'all');
  assert.equal(normalized.slideIndex, slides.length - 1);
  assert.throws(() => normalizeProjectionState({ messages: [] }), { status: 400 });
});

test('public viewers cannot control projections; ending and expiry revoke the displayed content', async () => {
  const admin = memoryAdmin();
  const call = request(createDebateProjectionHandler({ getAdmin: () => admin, authenticate: async req => {
    if (req.headers.authorization !== 'Bearer signed-in') throw Object.assign(new Error('Sign in'), { status: 401 });
  } }));
  const state = initialProjectionState({ question: 'Pourquoi croire ?', messages: [{ role: 'user', text: 'Réponse de l’assemblée' }] });
  assert.equal((await call('POST', { action: 'create', state })).status, 401);
  assert.equal(admin.rows.size, 0);
  const created = await call('POST', { action: 'create', state }, '', 'Bearer signed-in');
  assert.equal(created.status, 201);
  const { token, controlToken } = created.body;
  const publicState = await call('GET', null, token);
  assert.equal(publicState.status, 200);
  assert.equal(publicState.headers['Cache-Control'], 'no-store');
  assert.equal(publicState.body.state.messages[0].text, state.messages[0].text);
  assert.ok(!JSON.stringify(publicState.body).includes(controlToken));
  assert.ok(!JSON.stringify(publicState.body).includes('admin_password'));
  assert.equal((await call('POST', { action: 'update', token, state }, '', `Bearer ${token}`)).status, 401);
  assert.equal((await call('POST', { action: 'end', token }, '', `Bearer ${'a'.repeat(64)}`)).status, 401);
  const changed = { ...state, frozen: true, frozenAt: Date.now(), focus: 'chat' };
  assert.equal((await call('POST', { action: 'update', token, state: changed }, '', `Bearer ${controlToken}`)).status, 200);
  assert.equal((await call('GET', null, token)).body.state.frozen, true);
  assert.equal((await call('POST', { action: 'end', token }, '', `Bearer ${controlToken}`)).status, 200);
  assert.deepEqual((await call('GET', null, token)).body, { status: 'ended' });
  assert.equal((await call('POST', { action: 'update', token, state }, '', `Bearer ${controlToken}`)).status, 410);
  const next = await call('POST', { action: 'create', state }, '', 'Bearer signed-in');
  admin.rows.get(next.body.token).course_content.expiresAt = Date.now() - 1000;
  assert.deepEqual((await call('GET', null, next.body.token)).body, { status: 'ended' });
  assert.equal((await call('GET', null, 'invalid')).status, 400);
  assert.equal((await call('GET', null, '00000000-0000-0000-0000-000000000000')).status, 404);
});
