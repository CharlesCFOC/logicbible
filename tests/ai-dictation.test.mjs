import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('Brother AI reuses the dictation field, preserves its draft and waits for final transcription before sending', async () => {
  const server = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { AiComposer, BrotherAiComposer } = await server.ssrLoadModule('/src/react/ai.jsx');
    const draft = 'Existing question. What does this verse mean?';
    const dictation = { field: 'message', phase: 'idle', active: false, message: '', edit() {}, start() {}, stop() {} };
    const render = (props = {}) => renderToStaticMarkup(React.createElement(BrotherAiComposer, {
      value: draft, onChange() {}, onSubmit() {}, ariaLabel: 'Message Brother AI', dictation, ...props,
    }));
    const idle = render();
    assert.match(idle, /class="message-composer"/);
    assert.equal((idle.match(/<form/g) || []).length, 1);
    assert.equal((idle.match(/type="submit"/g) || []).length, 1);
    assert.match(idle, /class="church-dictation"/);
    assert.match(idle, /aria-label="Dictate: Message Brother AI"/);
    assert.match(idle, /<textarea[^>]*>[\s\S]*Existing question\. What does this verse mean\?<\/textarea>/);
    assert.ok(!idle.includes('Read aloud:'));
    assert.ok(!idle.includes('Dictation language'));
    const fieldId = idle.match(/<textarea id="([^"]+)"/)[1];
    assert.ok(idle.includes(`aria-controls="${fieldId}"`));
    assert.ok(idle.includes(`aria-describedby="${fieldId}-dictation-status"`));
    assert.doesNotMatch(idle, /type="submit"[^>]*disabled/);

    const listening = render({ dictation: { ...dictation, active: true, phase: 'listening', message: 'Listening in English…' } });
    assert.match(listening, /aria-label="Stop dictation: Message Brother AI"/);
    assert.match(listening, /class="bible-voice-wave is-listening brother-ai-voice-wave"[\s\S]*class="message-composer"[\s\S]*<textarea/);
    assert.doesNotMatch(idle, /brother-ai-voice-wave/);
    assert.match(listening, /type="submit"[^>]*disabled/);

    const finishing = render({ dictation: { ...dictation, active: true, phase: 'finishing' } });
    assert.match(finishing, /disabled=""[^>]*aria-label="Finishing transcription: Message Brother AI"/);
    assert.match(finishing, /type="submit"[^>]*disabled/);

    const pending = render({ disabled: true });
    assert.match(pending, /<textarea[^>]*disabled/);
    assert.match(pending, /disabled=""[^>]*aria-label="Dictate: Message Brother AI"/);

    // The other users of AiComposer keep their existing text-only composer.
    const plain = renderToStaticMarkup(React.createElement(AiComposer, {
      value: draft, onChange() {}, onSubmit() {}, ariaLabel: 'Coach message', className: 'apologetics-debate-composer',
    }));
    assert.ok(!plain.includes('church-dictation'));
    assert.doesNotMatch(plain, /type="submit"[^>]*disabled/);
  } finally { await server.close(); }
});
