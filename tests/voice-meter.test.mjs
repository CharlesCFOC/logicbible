import test from 'node:test';
import assert from 'node:assert/strict';
import { startVoiceMeter } from '../src/shared/voice-meter.js';

const settle = () => new Promise(resolve => setImmediate(resolve));
function setup(overrides = {}) {
  const state = { stopped: 0, closed: 0, cancelled: [], levels: [], unavailable: 0, loud: false };
  const stream = { getTracks: () => [{ stop() { state.stopped++; } }] };
  const analyser = { frequencyBinCount: 512, disconnect() {}, getByteFrequencyData(array) { array.fill(0); if (state.loud) array.fill(220, 40, 80); } };
  const context = { sampleRate: 48000, state: 'running', createAnalyser: () => analyser, createMediaStreamSource: () => ({ connect() {}, disconnect() {} }), resume: async () => {}, async close() { state.closed++; this.state = 'closed'; } };
  const stop = startVoiceMeter({ getStream: async () => stream, createContext: () => context, requestFrame(callback) { state.next = callback; return 7; }, cancelFrame: id => state.cancelled.push(id), onLevels: levels => state.levels.push([...levels]), onUnavailable: () => state.unavailable++, ...overrides });
  return { state, stop, stream };
}

test('meter bands follow real frequency data, fall to silence and release audio on stop', async () => {
  const { state, stop } = setup();
  await settle();
  assert.ok(state.levels[0].every(level => level === 0));
  state.loud = true; state.next();
  assert.ok(state.levels.at(-1).some(level => level > .8));
  assert.ok(state.levels.at(-1).some(level => level === 0));
  state.loud = false; state.next();
  assert.ok(state.levels.at(-1).every(level => level === 0));
  const lateFrame = state.next; const count = state.levels.length;
  stop(); lateFrame(); stop();
  assert.equal(state.levels.length, count);
  assert.equal(state.stopped, 1); assert.equal(state.closed, 1);
  assert.deepEqual(state.cancelled, [7]);
});

test('a permission response arriving after dictation stops immediately releases its stream', async () => {
  let grant;
  const { state, stop, stream } = setup({ getStream: () => new Promise(resolve => { grant = resolve; }) });
  stop(); grant(stream); await settle();
  assert.equal(state.stopped, 1); assert.equal(state.closed, 0);
  assert.equal(state.levels.length, 0);
});

test('a denied microphone or unavailable audio analyser leaves dictation independent', async () => {
  const denied = setup({ getStream: async () => { throw Error('denied'); } });
  await settle(); assert.equal(denied.state.unavailable, 1); denied.stop();
  const unsupported = setup({ createContext: () => { throw Error('unsupported'); } });
  await settle(); assert.equal(unsupported.state.unavailable, 1); assert.equal(unsupported.state.stopped, 1); unsupported.stop();
});
