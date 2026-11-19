import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const sources = ['verse-actions', 'verse-selection'].map(name =>
  readFileSync(new URL(`../scripts/features/${name}.js`, import.meta.url), 'utf8')).join('\n')
  + '\n' + readFileSync(new URL('../scripts/features/navigation.js', import.meta.url), 'utf8')
  + '\n' + readFileSync(new URL('../scripts/bridges/bible-reader.js', import.meta.url), 'utf8');

function harness() {
  const verses = [1, 2, 3].map(number => ({
    key: `KJV.JHN.15.${number}`, highlightKey: `JHN.15.${number}`,
    reference: `John 15:${number}`, number, text: `Verse ${number}`, version: 'KJV',
  }));
  const node = () => {
    const classes = new Set();
    const styles = new Map();
    return { hidden: false, disabled: true, value: '', classes, styles,
      classList: {
        add: name => classes.add(name), remove: name => classes.delete(name),
        contains: name => classes.has(name),
        toggle(name, active) { if (active) classes.add(name); else classes.delete(name); },
      },
      style: { setProperty: (key, value) => styles.set(key, value), removeProperty: key => styles.delete(key) },
    };
  };
  const lines = verses.map(verse => ({ ...node(), dataset: { highlightKey: verse.highlightKey } }));
  const folder = node();
  const remove = node();
  let notifications = 0;
  let chapterChanges = 0;
  const stored = new Map();
  const context = vm.createContext({
    savedState: { highlights: {}, bookmarks: {} }, selectedVerseData: verses[0],
    multiSelectMode: true, multiSelectedVerseData: verses.slice(0, 2),
    highlightColors: [{ id: 'gold', label: 'Yellow', value: '#ff0' }, { id: 'blue', label: 'Blue', value: '#00f' }],
    verseDetail: { hidden: false, querySelector: selector => selector.includes('folder-select') ? folder : remove, querySelectorAll: () => [] },
    document: { querySelectorAll(selector) {
      if (selector.startsWith('[data-highlight-key=')) return lines.filter(line => selector.includes(`"${line.dataset.highlightKey}"`));
      return lines;
    } },
    CSS: { escape: value => value }, multiSelectMenuToggle: node(), noteAddSaveButton: node(),
    noteEditorAddingVerses: false, selectedVerse: { textContent: '' },
    readerState: { showHighlightsOnly: false }, currentChapterData: null,
    window: {}, sheetFeedback: { textContent: '' }, getOriginalLanguage: () => ({ label: 'Greek' }),
    noteEditorPanel: node(), verseSheet: node(), verseAiPanel: node(),
    modalLayer: {}, appShell: { dataset: {} }, readerScreen: node(),
    hideVerseDetail() {},
    setFeedback() {}, syncVerseActionStates() {}, refreshProfilePanel() {}, refreshHomeLibraryPanel() {},
    getFolderName: (_type, id) => id || 'No folder',
    emitBibleVerseUiChange() { notifications += 1; },
    emitBibleChapterChange() { chapterChanges += 1; },
    writeJson(key, value) { stored.set(key, JSON.parse(JSON.stringify(value))); },
  });
  vm.runInContext(sources, context);
  context.installBibleReaderBridge();
  return { context, verses, lines, folder, remove, stored,
    get notifications() { return notifications; }, get chapterChanges() { return chapterChanges; } };
}

test('successive color choices and folder changes continue to target the entire selection', () => {
  const h = harness();
  h.context.clearMultiSelectionVisuals();
  h.context.applyHighlight('gold');
  h.context.applyHighlight('blue');
  h.context.updateSelectedHighlightFolder('study');
  for (const verse of h.verses.slice(0, 2)) {
    const saved = h.stored.get('brother.highlights')[verse.highlightKey];
    assert.equal(saved.color, 'blue');
    assert.equal(saved.folderId, 'study');
  }
  assert.equal(h.context.savedState.highlights[h.verses[2].highlightKey], undefined);
});

test('choosing No folder clears an existing folder on every highlighted verse', () => {
  const h = harness();
  for (const verse of h.verses.slice(0, 2)) h.context.savedState.highlights[verse.highlightKey] = { folderId: 'old' };
  h.folder.value = '';
  h.context.applyHighlight('blue');
  for (const verse of h.verses.slice(0, 2)) assert.equal(h.context.savedState.highlights[verse.highlightKey].folderId, '');
});

test('remove handles a mixed selection even when its first verse has no highlight', () => {
  const h = harness();
  h.context.savedState.highlights[h.verses[1].highlightKey] = { color: 'blue' };
  h.context.savedState.highlights[h.verses[2].highlightKey] = { color: 'gold' };
  h.lines[1].classList.add('is-highlighted');
  h.context.removeHighlight();
  assert.equal(h.context.savedState.highlights[h.verses[1].highlightKey], undefined);
  assert.equal(h.lines[1].classes.has('is-highlighted'), false);
  assert.equal(h.context.savedState.highlights[h.verses[2].highlightKey].color, 'gold');
});

test('highlight changes refresh the React chapter snapshot and enable removal immediately', () => {
  const h = harness();
  h.context.applyHighlight('blue');
  assert.ok(h.chapterChanges > 0);
  assert.equal(h.remove.disabled, false);
});

test('ending selection notifies the React reader', () => {
  const h = harness();
  h.context.exitMultiSelectMode();
  assert.equal(h.context.multiSelectedVerseData.length, 0);
  assert.ok(h.notifications > 0);
});

test('opening the palette hides selection outlines while preserving its action targets', () => {
  const h = harness();
  h.context.clearMultiSelectionVisuals();
  const snapshot = h.context.window.bibleReaderBridge.getVerseSnapshot();
  assert.equal(snapshot.selectedKeys.length, 0);
  assert.equal(snapshot.reference, '2 verses selected');
  assert.equal(h.context.multiSelectedVerseData.length, 2);
});

test('closing the palette clears the group before a subsequent single-verse highlight', () => {
  const h = harness();
  h.context.clearMultiSelectionVisuals();
  h.context.applyHighlight('blue');
  h.context.closeModal();
  assert.equal(h.context.multiSelectedVerseData.length, 0);
  h.context.selectedVerseData = h.verses[2];
  h.context.applyHighlight('gold');
  assert.equal(h.context.savedState.highlights[h.verses[0].highlightKey].color, 'blue');
  assert.equal(h.context.savedState.highlights[h.verses[1].highlightKey].color, 'blue');
  assert.equal(h.context.savedState.highlights[h.verses[2].highlightKey].color, 'gold');
});

test('scrolling cannot replace the action target while editing a selection', () => {
  const h = harness();
  h.context.clearMultiSelectionVisuals();
  h.context.updateFocusedVerseFromScroll();
  assert.equal(h.context.selectedVerseData.highlightKey, h.verses[0].highlightKey);
});

test('removing a group immediately after highlighting it updates storage and the palette', () => {
  const h = harness();
  h.context.clearMultiSelectionVisuals();
  h.context.applyHighlight('blue');
  h.context.removeHighlight();
  assert.equal(Object.keys(h.stored.get('brother.highlights')).length, 0);
  assert.equal(h.remove.disabled, true);
  assert.ok(h.lines.every(line => !line.classes.has('is-highlighted')));
});
