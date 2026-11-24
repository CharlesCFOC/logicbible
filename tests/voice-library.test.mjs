import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

test('voice searches match local notes and bookmarks by text or Bible reference', () => {
  const context = vm.createContext({
    window: {}, savedState: { aiBookmarks: { a: { id: 'a', text: 'A response about hope' } } },
    getSavedNoteRows: () => [{ id: 'n1', title: 'Espérance', note: 'Une pensée sur la foi', items: [{ bookId: 'JHN', chapter: 11, number: 35, reference: 'John 11:35' }] }],
    getSavedRows: () => [{ storageKey: 'b1', bookId: 'JHN', chapter: 11, number: 35, reference: 'John 11:35', text: 'Jesus wept' }],
    openSavedVerse() {}, openSavedNote() {},
  });
  vm.runInContext(readFileSync(new URL('../scripts/bridges/home-library.js', import.meta.url), 'utf8'), context);
  context.installHomeLibraryBridge();
  const bridge = context.window.homeLibraryBridge;
  assert.equal(bridge.searchVoiceItems('notes', 'esperance', null)[0].key, 'n1');
  assert.equal(bridge.searchVoiceItems('bookmarks', '', { bookId: 'JHN', chapter: 11, verse: 35 })[0].key, 'b1');
  assert.equal(bridge.searchVoiceItems('bookmarks', 'hope', null)[0].kind, 'ai-bookmark');
  assert.equal(bridge.searchVoiceItems('notes', 'missing', null).length, 0);
});
