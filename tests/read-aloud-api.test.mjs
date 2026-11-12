import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { EventEmitter } from 'node:events';
import { normalizeReadAloud, generateReadAloud } from '../lib/ai/read-aloud.js';
import { requestReadAloud } from '../src/react/pilot-ai.js';

test('voice input is bounded before any quota reservation or external request', async () => {
  for (const input of [{}, { text: '' }, { text: 'x'.repeat(4001) }, { text: 'é'.repeat(2501) }, { text: 'Hello', language: 'invalid' }]) {
    await assert.rejects(generateReadAloud(input, { reserve: () => { throw Error('must not call'); } }), { status: 400 });
  }
  assert.deepEqual(normalizeReadAloud({ text: ' Hello ' }), { text: 'Hello', language: 'en' });
});

test('voice generation reserves quota and requests Google Neural2 MP3 narration', async t => {
  const key = process.env.GOOGLE_CLOUD_TTS_API_KEY;process.env.GOOGLE_CLOUD_TTS_API_KEY = 'test-only';
  t.after(() => { if (key === undefined) delete process.env.GOOGLE_CLOUD_TTS_API_KEY;else process.env.GOOGLE_CLOUD_TTS_API_KEY = key; });
  let reserved = false;let body;
  const audio = await generateReadAloud({ text: 'How can we forgive?' }, {
    reserve: async () => { reserved = true; },
    fetcher: async (url, options) => { assert.equal(reserved, true);assert.equal(url, 'https://texttospeech.googleapis.com/v1/text:synthesize');assert.equal(options.headers['X-Goog-Api-Key'], 'test-only');assert.equal(options.headers.Authorization, undefined);body = JSON.parse(options.body);return Response.json({ audioContent: Buffer.from('mp3-audio').toString('base64') }); },
  });
  assert.equal(audio.toString(), 'mp3-audio');assert.equal(body.voice.name, 'en-US-Neural2-F');assert.equal(body.voice.languageCode, 'en-US');assert.equal(body.audioConfig.audioEncoding, 'MP3');assert.deepEqual(body.input, { text: 'How can we forgive?' });
  await assert.rejects(generateReadAloud({ text: 'Hello' }, { reserve: async () => {}, fetcher: async () => Response.json({}) }), { status: 502 });
  await assert.rejects(generateReadAloud({ text: 'Hello' }, { reserve: async () => { throw Object.assign(Error('quota'), { status: 429 }); }, fetcher: () => { throw Error('must not fetch'); } }), { status: 429 });
});

test('French text uses the French Neural2 voice and stays plain text without SSML', async t => {
  const key = process.env.GOOGLE_CLOUD_TTS_API_KEY;process.env.GOOGLE_CLOUD_TTS_API_KEY = 'test-only';
  t.after(() => { if (key === undefined) delete process.env.GOOGLE_CLOUD_TTS_API_KEY;else process.env.GOOGLE_CLOUD_TTS_API_KEY = key; });
  await generateReadAloud({ text: '<speak>Comment pardonner ?</speak>', language: 'fr', voice: 'fr-CA-Studio-O' }, {
    reserve: async () => {},
    fetcher: async (url, options) => { const body = JSON.parse(options.body);assert.deepEqual(body.voice, { languageCode: 'fr-CA', name: 'fr-CA-Neural2-A' });assert.deepEqual(body.input, { text: '<speak>Comment pardonner ?</speak>' });return Response.json({ audioContent: Buffer.from('mp3-audio').toString('base64') }); },
  });
});

test('missing Google configuration does not reserve quota or fall back to OpenAI', async t => {
  const key = process.env.GOOGLE_CLOUD_TTS_API_KEY;delete process.env.GOOGLE_CLOUD_TTS_API_KEY;
  t.after(() => { if (key !== undefined) process.env.GOOGLE_CLOUD_TTS_API_KEY = key; });
  await assert.rejects(generateReadAloud({ text: 'Hello' }, { reserve: () => { throw Error('must not reserve'); }, fetcher: () => { throw Error('must not fetch'); } }), { status: 503 });
});

test('Google credential and throttling errors have actionable messages', async t => {
  const key = process.env.GOOGLE_CLOUD_TTS_API_KEY;process.env.GOOGLE_CLOUD_TTS_API_KEY = 'test-only';
  t.after(() => { if (key === undefined) delete process.env.GOOGLE_CLOUD_TTS_API_KEY;else process.env.GOOGLE_CLOUD_TTS_API_KEY = key; });
  await assert.rejects(generateReadAloud({ text: 'Hello' }, { reserve: async () => {}, fetcher: async () => Response.json({ error: {} }, { status: 403 }) }), { status: 503, message: /Google Text-to-Speech API/ });
  await assert.rejects(generateReadAloud({ text: 'Hello' }, { reserve: async () => {}, fetcher: async () => Response.json({ error: {} }, { status: 429 }) }), { status: 429 });
});

test('voice transport signs requests, forwards cancellation and returns audio only', async () => {
  const requests = [];const signal = new AbortController().signal;
  const createAuthClient = () => ({ auth: { getSession: async () => ({ data: { session: { access_token: 'test-token' } } }) } });
  const fetcher = async (url, options) => { requests.push({ url, options });return url.endsWith('config') ? Response.json({ configured: true, url: 'https://example.supabase.co', anonKey: 'public-test' }) : new Response('mp3-audio', { headers: { 'Content-Type': 'audio/mpeg' } }); };
  const result = await requestReadAloud('A question', { signal, fetcher, createAuthClient });
  assert.equal(result.type, 'audio/mpeg');assert.equal(requests[1].url, '/api/ai/read-aloud');assert.equal(requests[1].options.signal, signal);assert.equal(requests[1].options.headers.Authorization, 'Bearer test-token');
  assert.deepEqual(JSON.parse(requests[1].options.body), { text: 'A question', language: 'en' });
  await assert.rejects(requestReadAloud('A question', { fetcher, createAuthClient: () => ({ auth: { getSession: async () => ({ data: { session: null } }) } }) }), /Sign in/);
});

test('HTTP voice route protects audio generation with authentication and quota', async t => {
  const originalFetch = globalThis.fetch;const saved = { ...process.env };
  Object.assign(process.env, { VERCEL: '1', SUPABASE_URL: 'https://voice-test.supabase.co', SUPABASE_ANON_KEY: 'public-test', SUPABASE_SERVICE_ROLE_KEY: 'server-test', GOOGLE_CLOUD_TTS_API_KEY: 'model-test' });
  t.after(() => { globalThis.fetch = originalFetch;for (const key of ['VERCEL', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'GOOGLE_CLOUD_TTS_API_KEY']) { if (saved[key] === undefined) delete process.env[key];else process.env[key] = saved[key]; } });
  const calls = [];
  globalThis.fetch = async url => {
    calls.push(String(url));
    if (String(url).includes('/auth/v1/user')) return Response.json({ id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated' });
    if (String(url).includes('/rpc/reserve_ai_call')) return Response.json({ allowed: true });
    if (String(url) === 'https://texttospeech.googleapis.com/v1/text:synthesize') return Response.json({ audioContent: Buffer.from('mp3-audio').toString('base64') });
    throw Error('Unexpected network request');
  };
  const { default: handler } = await import('../server.mjs');
  async function request(token) {
    const req = Readable.from([JSON.stringify({ text: 'A question' })]);Object.assign(req, { url: '/api/ai/read-aloud', method: 'POST', headers: token ? { authorization: `Bearer ${token}` } : {}, socket: { remoteAddress: '127.0.0.1' } });
    const res = Object.assign(new EventEmitter(), { headers: {}, setHeader(name, value) { this.headers[name.toLowerCase()] = value; }, writeHead(status, headers) { this.status = status;Object.assign(this.headers, headers); }, end(body) { this.body = body;this.writableEnded = true; } });
    await handler(req, res);return res;
  }
  const unsigned = await request();assert.equal(unsigned.status, 401);assert.equal(calls.length, 0);
  const signed = await request('test-token');assert.equal(signed.status, 200);assert.equal(signed.headers['Content-Type'], 'audio/mpeg');assert.equal(signed.body.toString(), 'mp3-audio');
  assert.ok(calls[0].includes('/auth/v1/user'));assert.ok(calls[1].includes('/rpc/reserve_ai_call'));assert.equal(calls[2], 'https://texttospeech.googleapis.com/v1/text:synthesize');
});
