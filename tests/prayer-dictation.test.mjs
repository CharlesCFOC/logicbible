import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { createDictationSession } from '../src/shared/speech-dictation.js';

const hookSource = readFileSync(new URL('../src/react/use-dictation.js', import.meta.url), 'utf8')
  .replace(/^import .*;\n/gm, '').replace('export function useDictation', 'function useDictation');

function setup({ initialText = '', language = 'fr', maxLength = 2200 } = {}) {
  const values = { request: initialText };
  const slots = [];
  const effects = [];
  const cleanups = [];
  const recordings = [];
  let cursor = 0;
  const window = new EventTarget();
  const document = new EventTarget();
  document.hidden = false;
  window.SpeechRecognition = class {
    constructor() { recordings.push(this); }
    start() { this.onstart?.(); }
    stop() { this.stopped = true; }
    abort() { this.aborted = true; }
  };
  const context = vm.createContext({ window, document, createDictationSession, stopReadAloud() {},
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], value => { slots[index] = value; }];
    },
    useRef(initial) {
      const index = cursor++;
      return slots[index] ||= { current: initial };
    },
    useEffect(effect) {
      const index = cursor++;
      if (!(index in slots)) { slots[index] = true; effects.push(effect); }
    },
  });
  vm.runInContext(hookSource, context);
  const render = () => {
    cursor = 0;
    const result = context.useDictation({ values: { ...values }, language, maxLength,
      onChange: (key, value) => { values[key] = value; },
    });
    while (effects.length) cleanups.push(effects.shift()());
    return result;
  };
  return { values, recordings, window, document, render, dispose: () => cleanups.forEach(cleanup => cleanup?.()) };
}

function speech(transcript) {
  return { results: [Object.assign([{ transcript }], { isFinal: true })] };
}

test('prayer dictation uses French, preserves a long draft and respects the full 2200-character field', () => {
  const h = setup({ initialText: 'a'.repeat(1300) });
  try {
    h.render().start('request');
    const recognition = h.recordings[0];
    assert.equal(recognition.lang, 'fr-CA');
    recognition.onresult(speech('Priez pour ma famille.'));
    assert.equal(h.values.request, `${'a'.repeat(1300)} Priez pour ma famille.`);
    recognition.onresult(speech('b'.repeat(1500)));
    assert.equal(h.values.request.length, 2200);
    assert.equal(recognition.stopped, true);
    recognition.onend();
    assert.equal(h.render().active, false);
  } finally { h.dispose(); }
});

test('leaving Prayer stops the microphone and accepts its final words before finishing', () => {
  const h = setup({ language: 'en' });
  try {
    h.render().start('request');
    const recognition = h.recordings[0];
    assert.equal(recognition.lang, 'en-US');
    assert.equal(h.render().active, true);
    h.window.dispatchEvent(new Event('app:screen-change'));
    assert.equal(recognition.stopped, true);
    recognition.onresult(speech('Please pray for my family.'));
    recognition.onend();
    assert.equal(h.values.request, 'Please pray for my family.');
    assert.equal(h.render().active, false);
  } finally { h.dispose(); }
});

test('typing into the prayer draft cancels dictation and ignores late voice results', () => {
  const h = setup();
  try {
    h.render().start('request');
    const recognition = h.recordings[0];
    const lateResult = recognition.onresult;
    h.render().edit('request', 'Ma demande corrigée.');
    lateResult(speech('Ne pas ajouter.'));
    assert.equal(h.values.request, 'Ma demande corrigée.');
    assert.equal(recognition.aborted, true);
  } finally { h.dispose(); }
});

test('Prayer request renders an accessible microphone without a dictation language selector', async () => {
  const originalWindow = globalThis.window;
  globalThis.window = { prayerBridge: {
    getSnapshot: () => ({ pageTab: 'request', requests: [], requestCategory: 'general', backgroundIndex: 0 }),
    getSelectableBackgroundOptions: () => [{ index: 0, id: 'blue', label: 'Blue', src: '/blue.png' }],
  } };
  const server = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { PrayerPage } = await server.ssrLoadModule('/src/react/prayer.jsx');
    const html = renderToStaticMarkup(React.createElement(PrayerPage));
    assert.match(html, /aria-label="Dictate: Prayer request"/);
    assert.match(html, /aria-controls="prayer-request-text"/);
    assert.match(html, /<textarea[^>]*id="prayer-request-text"[^>]*maxLength="2200"/);
    assert.ok(!html.includes('Dictation language'));
    assert.ok(!html.includes('prayer-dictation-language'));
    assert.ok(!html.includes('Read aloud: Prayer request'));
  } finally {
    await server.close();
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});
