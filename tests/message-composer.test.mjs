import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('shared composer fits a parent form and locks sending while dictation finishes', async () => {
  const server = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { MessageComposer } = await server.ssrLoadModule('/src/react/message-composer.jsx');
    for (const field of ['message', 'request']) {
      const render = (active, phase) => renderToStaticMarkup(React.createElement('form', null,
        React.createElement(MessageComposer, {
          value: 'Existing draft', onChange() {}, id: `test-${field}`, ariaLabel: field,
          required: true, maxLength: 2200, dictationField: field,
          dictation: { field, active, phase, message: '', edit() {}, start() {}, stop() {} },
        })));
      const idle = render(false, 'idle');
      assert.equal((idle.match(/<form/g) || []).length, 1);
      assert.match(idle, /<textarea[^>]*maxLength="2200"[^>]*required=""/);
      assert.ok(idle.includes('Existing draft</textarea>'));
      assert.ok(idle.includes(`aria-controls="test-${field}"`));
      assert.doesNotMatch(idle, /type="submit"[^>]*disabled/);
      for (const phase of ['listening', 'finishing']) {
        assert.match(render(true, phase), /type="submit"[^>]*disabled/);
      }
    }
  } finally { await server.close(); }
});
