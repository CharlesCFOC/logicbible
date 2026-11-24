import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { parseBibleReference } from '../src/shared/bible-reference.js';

const books = [
  { id: 'JHN', name: 'John', chapters: 21 },
  { id: 'EPH', name: 'Ephesians', chapters: 6 },
  { id: 'MAT', name: 'Matthew', chapters: 28 },
];

test('voice references resolve French, English, and numeric chapter and verse phrases', () => {
  assert.deepEqual(parseBibleReference('Jean, chapitre trois, verset seize', books), {
    bookId: 'JHN', chapter: 3, verse: 16, bookName: 'John',
  });
  assert.deepEqual(parseBibleReference('Éphésiens chapitre un verset quatre', books), {
    bookId: 'EPH', chapter: 1, verse: 4, bookName: 'Ephesians',
  });
  assert.deepEqual(parseBibleReference('Ephesians chapter one verse four', books), {
    bookId: 'EPH', chapter: 1, verse: 4, bookName: 'Ephesians',
  });
  assert.deepEqual(parseBibleReference('Jean 3:16', books), {
    bookId: 'JHN', chapter: 3, verse: 16, bookName: 'John',
  });
  assert.deepEqual(parseBibleReference("Tu peux m'ouvrir Mathieu cinq verset trois", books), {
    bookId: 'MAT', chapter: 5, verse: 3, bookName: 'Matthew',
  });
});

test('Bible bridge loads the requested chapter and scrolls to the matching verse', async () => {
  const calls = [];
  let finishHighlight;
  const target = {
    dataset: { verseNumber: '16' },
    classList: { add: name => calls.push(['highlight', name]), remove: name => calls.push(['remove', name]) },
    scrollIntoView: options => calls.push(['scroll', options]),
  };
  const bibleScreen = { scrollTo: options => calls.push(['top', options]) };
  const context = vm.createContext({
    BOOKS: books,
    readerState: { bookId: 'GEN', chapter: 1, showHighlightsOnly: true, parallelVersionIds: [] },
    renderBookOptions: () => calls.push(['book-options']),
    renderChapterOptions: () => calls.push(['chapter-options']),
    renderParallelOptions: () => calls.push(['parallel-options']),
    loadChapter: async () => ({ verses: [] }),
    requestAnimationFrame: callback => callback(),
    document: {
      querySelectorAll: () => [target],
      querySelector: () => bibleScreen,
    },
    window: { setTimeout: (callback, delay) => { finishHighlight = callback; calls.push(['timer', delay]); return 1; } },
  });
  vm.runInContext(readFileSync(new URL('../scripts/bridges/bible-reader.js', import.meta.url), 'utf8'), context);
  context.installBibleReaderBridge();
  await context.window.bibleReaderBridge.navigateToReference('JHN', 3, 16);

  assert.equal(context.readerState.bookId, 'JHN');
  assert.equal(context.readerState.chapter, 3);
  assert.equal(context.readerState.showHighlightsOnly, false);
  assert.ok(calls.some(([name]) => name === 'parallel-options'));
  assert.ok(calls.some(([name, options]) => name === 'scroll' && options.block === 'center'));
  assert.ok(calls.some(([name]) => name === 'highlight'));
  assert.ok(calls.some(([name, delay]) => name === 'timer' && delay === 4000));
  finishHighlight();
  assert.ok(calls.some(([name, value]) => name === 'remove' && value === 'is-voice-target'));
});
