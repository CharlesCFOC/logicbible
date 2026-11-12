import test from 'node:test';
import assert from 'node:assert/strict';
import { createDictationSession } from '../src/shared/speech-dictation.js';

function setup(options = {}) {
  const text = { topic: 'Sujet existant.', context: '' }; const states = []; const recordings = [];
  const session = createDictationSession({
    createRecognition() { const recognition = { starts: 0, start() { this.starts++; this.onstart?.(); }, stop() { this.stopped = true; }, abort() { this.aborted = true; } }; recordings.push(recognition); return recognition; },
    getText: field => text[field], writeText: (field, value) => { text[field] = value; }, onState: state => states.push(state), ...options,
  });
  return { session, text, states, recordings };
}
function result(transcript, isFinal) { return Object.assign([{ transcript }], { isFinal }); }

test('French final segments append without replacing existing text or duplicating repeated events', () => {
  const { session, text, recordings } = setup();
  session.start('topic', 'fr');const recognition = recordings[0];
  assert.equal(recognition.lang, 'fr-CA'); assert.equal(recognition.interimResults, true);
  recognition.onresult({ results: [result('Comment pardonner', true), result('à un ami ?', true)] });
  recognition.onresult({ results: [result('Comment pardonner', true), result('à un ami ?', true)] });
  assert.equal(text.topic, 'Sujet existant. Comment pardonner à un ami ?');
  session.dispose();
});

test('interim revisions write directly into the field and finalization does not duplicate them', () => {
  const { session, text, states, recordings } = setup();session.start('context', 'en');const recognition = recordings[0];
  assert.equal(recognition.lang, 'en-US');assert.equal(recognition.continuous, true);
  recognition.onresult({ results: [result('A youth', false)] });
  assert.equal(text.context, 'A youth');assert.equal(states.at(-1).interim, 'A youth');
  recognition.onresult({ results: [result('A youth group discussing forgiveness.', false)] });
  assert.equal(text.context, 'A youth group discussing forgiveness.');
  recognition.onresult({ results: [result('A youth group discussing forgiveness.', true)] });
  assert.equal(text.context, 'A youth group discussing forgiveness.');
  session.stop();recognition.onend();assert.equal(states.at(-1).phase, 'idle');session.dispose();
});

test('speech pauses keep the microphone on until the user stops it, including trailing final text', () => {
  const { session, text, states, recordings } = setup();session.start('context', 'fr');const recognition = recordings[0];
  recognition.onresult({ results: [result('Un groupe', false)] });recognition.onspeechend?.();
  assert.equal(recognition.stopped, undefined);assert.equal(states.at(-1).phase, 'listening');
  session.stop();
  assert.equal(recognition.stopped, true);assert.equal(states.at(-1).phase, 'finishing');
  recognition.onresult({ results: [result('Un groupe de jeunes adultes.', true)] });recognition.onend();
  assert.equal(text.context, 'Un groupe de jeunes adultes.');assert.equal(states.at(-1).phase, 'idle');session.dispose();
});

test('browser silence timeouts resume recognition and append new speech without duplication', async () => {
  const { session, text, states, recordings } = setup({ restartDelayMs: 5 });session.start('context', 'en');
  const recognition = recordings[0];
  recognition.onresult({ results: [result('A complete thought.', true)] });
  recognition.onerror({ error: 'no-speech' });recognition.onend();
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(recognition.starts, 2);assert.equal(recognition.stopped, undefined);
  assert.equal(states.at(-1).phase, 'listening');assert.equal(states.at(-1).error, false);
  recognition.onresult({ results: [result('Another', false)] });
  recognition.onresult({ results: [result('Another thought.', true)] });
  assert.equal(text.context, 'A complete thought. Another thought.');
  session.stop();recognition.onend();assert.equal(states.at(-1).phase, 'idle');session.dispose();
});

test('stopping during a browser restart delay cancels further listening', async () => {
  const { session, states, recordings } = setup({ restartDelayMs: 5 });session.start('context', 'en');
  recordings[0].onend();session.stop();
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(recordings[0].starts, 1);assert.equal(states.at(-1).phase, 'idle');session.dispose();
});

test('leaving the page cancels a pending restart and ignores late browser end events', async () => {
  const { session, recordings } = setup({ restartDelayMs: 5 });session.start('context', 'en');
  const lateEnd = recordings[0].onend;
  lateEnd();session.dispose();lateEnd();
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(recordings[0].starts, 1);assert.equal(recordings[0].aborted, true);
});

test('manual edits stop dictation and cannot be overwritten by late recognition events', () => {
  const { session, text, recordings } = setup();session.start('context', 'en');
  recordings[0].onresult({ results: [result('A draft', false)] });const late = recordings[0].onresult;
  session.stopForEdit('context');text.context = 'My corrected context.';
  late({ results: [result('A different transcript.', true)] });
  assert.equal(recordings[0].aborted, true);assert.equal(text.context, 'My corrected context.');session.dispose();
});

test('external changes to a field are preserved instead of overwritten by voice results', () => {
  const { session, text, recordings } = setup();session.start('context', 'en');
  recordings[0].onresult({ results: [result('An interim phrase', false)] });text.context = 'A chosen existing question.';
  recordings[0].onresult({ results: [result('The final phrase.', true)] });
  assert.equal(text.context, 'A chosen existing question.');assert.equal(recordings[0].aborted, true);session.dispose();
});

test('only one field can record at a time; stopping accepts the final words then releases the microphone', () => {
  const { session, text, states, recordings } = setup();
  assert.equal(session.start('topic', 'fr'), true);assert.equal(session.start('context', 'en'), false);
  session.stop();assert.equal(recordings[0].stopped, true);assert.equal(states.at(-1).phase, 'finishing');
  recordings[0].onresult({ results: [result('Une dernière phrase.', true)] });recordings[0].onend();
  assert.match(text.topic, /Une dernière phrase/);assert.equal(session.start('context', 'en'), true);
  session.dispose();assert.equal(recordings[1].aborted, true);
});

test('permission errors are actionable, preserve text and allow a fresh recording', () => {
  const { session, text, states, recordings } = setup();session.start('topic', 'fr');
  recordings[0].onerror({ error: 'not-allowed' });
  assert.equal(states.at(-1).phase, 'idle');assert.match(states.at(-1).message, /Allow microphone/);assert.equal(text.topic, 'Sujet existant.');
  assert.equal(recordings[0].aborted, true);assert.equal(session.start('topic', 'en'), true);session.dispose();
});

test('dictation respects the form character limit and stops at the limit', () => {
  const { session, text, states, recordings } = setup({ maxLength: 24 });session.start('topic', 'fr');
  recordings[0].onresult({ results: [result('Une phrase beaucoup trop longue pour le champ.', true)] });
  assert.equal(text.topic.length, 24);assert.equal(recordings[0].stopped, true);recordings[0].onend();
  assert.match(states.at(-1).message, /limit/);session.dispose();
});

test('cleanup releases audio and ignores delayed recognition results after unmount', () => {
  const { session, text, states, recordings } = setup();session.start('context', 'en');
  const lateResult = recordings[0].onresult;const count = states.length;
  session.dispose();lateResult({ results: [result('Do not insert this.', true)] });
  assert.equal(recordings[0].aborted, true);assert.equal(text.context, '');assert.equal(states.length, count);
  assert.equal(session.start('context', 'en'), false);
});

test('an unsupported browser or failed startup leaves editable fields and a useful message', () => {
  const missing = setup({ createRecognition: () => null });
  assert.equal(missing.session.start('topic', 'fr'), false);assert.match(missing.states.at(-1).message, /not available/);
  const failed = setup({ createRecognition: () => ({ start() { throw new Error('blocked'); }, abort() {} }) });
  assert.equal(failed.session.start('topic', 'fr'), false);assert.match(failed.states.at(-1).message, /permissions/);
  missing.session.dispose();failed.session.dispose();
});
