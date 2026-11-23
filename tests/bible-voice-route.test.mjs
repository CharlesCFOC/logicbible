import test from 'node:test';
import assert from 'node:assert/strict';
import { handleBibleVoiceTranscription } from '../lib/routes/bible-voice.js';

function requestFor(body) {
  return {
    method: 'POST',
    async *[Symbol.asyncIterator]() { yield JSON.stringify(body); },
  };
}

test('AI voice route rejects malformed audio without calling the transcription provider', async () => {
  await assert.rejects(
    handleBibleVoiceTranscription(requestFor({ audioBase64: 'bad!', mimeType: 'audio/webm' }), {}),
    error => error.status === 400,
  );
});

test('AI voice route rejects unsupported audio formats', async () => {
  await assert.rejects(
    handleBibleVoiceTranscription(requestFor({ audioBase64: Buffer.from('audio').toString('base64'), mimeType: 'audio/x-unknown' }), {}),
    error => error.status === 415,
  );
});
