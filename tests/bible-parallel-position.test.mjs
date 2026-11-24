import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

test('switching parallel view restores the visible verse and its viewport position', () => {
  let top = -20;
  const verse = { dataset: { verseNumber: '16' }, getBoundingClientRect: () => ({ top, bottom: top + 120 }) };
  const screen = { scrollTop: 400, getBoundingClientRect: () => ({ top: 0, bottom: 600 }), querySelectorAll: () => [verse] };
  const context = vm.createContext({ document: { querySelector: () => screen } });
  vm.runInContext(readFileSync(new URL('../scripts/features/reader.js', import.meta.url), 'utf8'), context);
  const position = context.captureBibleReadingPosition();
  assert.equal(position.number, '16');
  assert.equal(position.offset, -20);
  top = 180;
  context.restoreBibleReadingPosition(position);
  assert.equal(screen.scrollTop, 600);
});

test('the parallel control requests position preservation in both directions', () => {
  const calls = [];
  const context = vm.createContext({ window: {}, readerState: { parallelEnabled: false }, renderParallelOptions() {}, loadChapter: options => calls.push(options) });
  vm.runInContext(readFileSync(new URL('../scripts/bridges/bible-reader.js', import.meta.url), 'utf8'), context);
  context.installBibleReaderBridge();
  context.window.bibleReaderBridge.toggleParallel();
  assert.equal(context.readerState.parallelEnabled, true);
  context.window.bibleReaderBridge.toggleParallel();
  assert.equal(context.readerState.parallelEnabled, false);
  assert.equal(calls.length, 2);
  assert.ok(calls.every(options => options.preservePosition === true));
});
