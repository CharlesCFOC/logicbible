import test from 'node:test';
import assert from 'node:assert/strict';
import { startBibleVoiceRecorder } from '../src/shared/bible-voice-recorder.js';

test('voice recorder waits for two seconds of silence before stopping', async () => {
  let animation;
  let speaking = true;
  let stopped = false;
  let silenceDetected = false;
  const track = { stop() { stopped = true; } };
  const analyser = {
    fftSize: 1024,
    frequencyBinCount: 512,
    getByteFrequencyData(samples) { samples.fill(speaking ? 120 : 0); },
    getByteTimeDomainData(samples) { samples.fill(speaking ? 150 : 128); },
    disconnect() {},
  };
  const recorder = {
    state: 'inactive',
    mimeType: 'audio/webm',
    start() { this.state = 'recording'; },
    stop() {
      this.state = 'inactive';
      this.ondataavailable({ data: new Blob(['test-audio'], { type: this.mimeType }) });
      this.onstop();
    },
  };
  const context = {
    state: 'running',
    sampleRate: 48_000,
    createAnalyser: () => analyser,
    createMediaStreamSource: () => ({ connect() {}, disconnect() {} }),
    resume: async () => {},
    close: async () => { context.state = 'closed'; },
  };
  const session = startBibleVoiceRecorder({
    getStream: async () => ({ getTracks: () => [track] }),
    createRecorder: () => recorder,
    createAudioContext: () => context,
    requestFrame: callback => { animation = callback; return 1; },
    cancelFrame() {},
    onSilence: () => { silenceDetected = true; },
    silenceMs: 2000,
  });

  await new Promise(resolve => setImmediate(resolve));
  animation(0);
  speaking = false;
  animation(100);
  animation(2099);
  assert.equal(silenceDetected, false);
  animation(2100);
  const blob = await session.done;
  assert.equal(silenceDetected, true);
  assert.equal(blob.size, 10);
  assert.equal(stopped, true);
});
