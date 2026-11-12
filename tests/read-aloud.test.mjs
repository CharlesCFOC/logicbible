import test from 'node:test';
import assert from 'node:assert/strict';
import { createReadAloud } from '../src/shared/read-aloud.js';

const clip = () => new Blob(['sample-audio'], { type: 'audio/mpeg' });
function setup(overrides = {}) {
  const requested = []; const played = []; const revoked = [];
  const reader = createReadAloud({
    requestAudio: async (text, options) => { requested.push({ text, ...options }); return clip(); },
    createUrl: () => `blob:test-${played.length}`,
    revokeUrl: url => revoked.push(url),
    createAudio(url) { const audio = { url, async play() { this.playing = true; }, pause() { this.playing = false; }, removeAttribute() {}, load() {} }; played.push(audio); return audio; },
    ...overrides,
  });
  return { reader, requested, played, revoked };
}

test('natural voice requests current text, shows loading, plays and stops on the same button', async () => {
  const { reader, requested, played, revoked } = setup();
  const pending = reader.toggle('question', 'How can we forgive?');
  assert.equal(reader.getState().loading, true);await pending;
  assert.equal(requested[0].text, 'How can we forgive?');assert.equal(requested[0].language, 'en');
  assert.equal(reader.getState().speaking, true);assert.equal(reader.getState().loading, false);
  const lateEnd = played[0].onended;
  await reader.toggle('question', 'How can we forgive?');lateEnd();
  assert.equal(reader.getState().speaking, false);assert.equal(played[0].playing, false);assert.deepEqual(revoked, ['blob:test-0']);
});

test('replaying a recent clip reuses generated audio and releases each playback URL', async () => {
  const { reader, requested, played, revoked } = setup();
  await reader.toggle('question', 'A question.');played[0].onended();
  await reader.toggle('question', 'A question.');reader.stop();
  assert.equal(requested.length, 1);assert.equal(played.length, 2);assert.equal(revoked.length, 2);
});

test('stopping while preparing aborts the request and ignores a late audio result', async () => {
  let resolve; let signal;
  const { reader, played } = setup({ requestAudio: (text, options) => { signal = options.signal; return new Promise(done => { resolve = done; }); } });
  const pending = reader.toggle('question', 'A question.');reader.stop();resolve(clip());await pending;
  assert.equal(signal.aborted, true);assert.equal(played.length, 0);assert.equal(reader.getState().loading, false);
});

test('another text replaces playback and old button cleanup cannot stop it', async () => {
  const { reader, played } = setup();
  await reader.toggle('topic', 'First question.');const lateEnd = played[0].onended;
  await reader.toggle('context', 'The story context.');reader.stop('topic');lateEnd();
  assert.equal(played[0].playing, false);assert.equal(reader.getState().id, 'context');assert.equal(reader.getState().speaking, true);
  played[1].onended();assert.equal(reader.getState().speaking, false);
});

test('API errors remain actionable without falling back to a robotic browser voice', async () => {
  const { reader, played } = setup({ requestAudio: async () => { throw Error('Sign in to Think Bible to use the natural voice.'); } });
  await reader.toggle('topic', 'A question.');assert.equal(played.length, 0);assert.match(reader.getState().error, /Sign in/);assert.equal(reader.getState().loading, false);
  const empty = setup();await empty.reader.toggle('topic', '  ');assert.equal(empty.requested.length, 0);
});

test('browser autoplay rejection offers another tap and keeps the prepared clip for retry', async () => {
  let attempts = 0;
  const { reader, requested } = setup({ createAudio: () => ({ async play() { if (!attempts++) throw Object.assign(Error('blocked'), { name: 'NotAllowedError' }); }, pause() {}, removeAttribute() {}, load() {} }) });
  await reader.toggle('topic', 'A question.');assert.match(reader.getState().error, /Tap Read aloud again/);
  await reader.toggle('topic', 'A question.');assert.equal(reader.getState().speaking, true);assert.equal(requested.length, 1);reader.stop();
});
