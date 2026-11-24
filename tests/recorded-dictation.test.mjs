import test from 'node:test';
import assert from 'node:assert/strict';
import { createRecordedDictationSession } from '../src/shared/recorded-dictation.js';
import { startBibleVoiceRecorder } from '../src/shared/bible-voice-recorder.js';

const settle = () => new Promise(resolve => setImmediate(resolve));
function setup(transcribe = async () => 'Bonjour à tous.') {
  let value = 'Texte existant.';
  let resolveRecording;
  let callbacks;
  const states = [];
  const recording = { done: new Promise(resolve => { resolveRecording = resolve; }), stop() { this.stopped = true; }, cancel() { this.cancelled = true; } };
  const session = createRecordedDictationSession({ createRecorder: options => { callbacks = options; return recording; }, transcribe, getText: () => value, writeText: (_, text) => { value = text; }, onState: state => states.push(state) });
  return { session, recording, states, callbacks: () => callbacks, resolveRecording, value: () => value, edit: text => { value = text; } };
}

test('recording silence transcribes and appends to the existing text', async () => {
  const h = setup();
  h.session.start('message');
  h.callbacks().onReady();
  h.callbacks().onSilence();
  assert.equal(h.states.at(-1).phase, 'finishing');
  h.resolveRecording(new Blob(['audio'], { type: 'audio/webm' }));
  await settle();
  assert.equal(h.value(), 'Texte existant. Bonjour à tous.');
  assert.equal(h.states.at(-1).phase, 'idle');
  h.session.dispose();
});

test('editing while transcription is pending cancels it and preserves the edit', async () => {
  let finishTranscript;
  const h = setup((_, { signal }) => new Promise(resolve => { finishTranscript = () => { assert.equal(signal.aborted, true); resolve('Ancien texte.'); }; }));
  h.session.start('message');
  h.resolveRecording(new Blob(['audio']));
  await settle();
  h.session.stopForEdit('message');
  h.edit('Ma correction');
  finishTranscript();
  await settle();
  assert.equal(h.value(), 'Ma correction');
  assert.equal(h.states.at(-1).phase, 'idle');
  h.session.dispose();
});

test('manual stop waits for the transcription and errors remain visible', async () => {
  const h = setup(async () => { throw new Error('Connectez-vous pour utiliser la reconnaissance vocale par IA.'); });
  h.session.start('message');
  h.session.stop();
  assert.equal(h.recording.stopped, true);
  h.resolveRecording(new Blob(['audio']));
  await settle();
  assert.equal(h.value(), 'Texte existant.');
  assert.equal(h.states.at(-1).error, true);
  assert.match(h.states.at(-1).message, /Connectez-vous/);
  h.session.dispose();
});

test('manual stop collects the final audio and inserts the resulting transcript', async () => {
  let value = 'Question existante.';
  let trackStopped = false;
  let audioReceived = '';
  const states = [];
  const analyser = { fftSize: 1024, frequencyBinCount: 512, disconnect() {} };
  const context = { state: 'running', sampleRate: 48000, createAnalyser: () => analyser, createMediaStreamSource: () => ({ connect() {}, disconnect() {} }), resume: async () => {}, async close() { this.state = 'closed'; } };
  const recorder = {
    state: 'inactive', mimeType: 'audio/webm',
    start() { this.state = 'recording'; },
    stop() {
      this.state = 'inactive';
      this.ondataavailable({ data: new Blob(['derniers mots'], { type: this.mimeType }) });
      this.onstop();
    },
  };
  const session = createRecordedDictationSession({
    createRecorder: callbacks => startBibleVoiceRecorder({ ...callbacks, getStream: async () => ({ getTracks: () => [{ stop() { trackStopped = true; } }] }), createRecorder: () => recorder, createAudioContext: () => context, requestFrame: () => 1, cancelFrame() {} }),
    transcribe: async blob => { audioReceived = await blob.text(); return 'Voici ma question.'; },
    getText: () => value, writeText: (_, text) => { value = text; }, onState: state => states.push(state),
  });
  session.start('message');
  await settle();
  assert.equal(states.at(-1).phase, 'listening');
  session.stop();
  assert.equal(states.at(-1).phase, 'finishing');
  await settle();
  assert.equal(audioReceived, 'derniers mots');
  assert.equal(value, 'Question existante. Voici ma question.');
  assert.equal(states.at(-1).phase, 'idle');
  assert.equal(trackStopped, true);
  session.dispose();
});
