import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

test('note changes autosave without a save button and restart the debounce on each edit', () => {
  const timers = new Map();
  let nextTimer = 0;
  let persisted;
  const context = vm.createContext({
    noteEditorDirty: false, noteAutosaveTimer: null, noteEditorStandaloneKey: null,
    noteEditorPanel: { classList: { contains: () => true } },
    noteEditorContent: { innerHTML: '<p>My note</p>', innerText: 'My note' },
    noteEditorRemovedVerseKeys: new Set(), noteEditorGroupId: 'group', noteEditorNoteTitle: 'Title', noteEditorFontSize: 17,
    savedState: { notes: {} }, CSS: { escape: value => value },
    document: { querySelectorAll: () => [] },
    window: { clearTimeout: id => timers.delete(id), setTimeout: (callback, delay) => { const id = ++nextTimer; timers.set(id, { callback, delay }); return id; } },
    writeJson: (_key, value) => { persisted = value; }, refreshProfilePanel() {}, setFeedback() {},
  });
  vm.runInContext(readFileSync(new URL('../scripts/features/notes.js', import.meta.url), 'utf8'), context);
  context.getNoteSelectionItems = () => [{ key: 'JHN.1.1' }];
  context.sanitizeNoteHtml = html => html;
  context.markNoteEditorDirty();
  context.markNoteEditorDirty();
  assert.equal(timers.size, 1);
  const timer = [...timers.values()][0];
  assert.equal(timer.delay, 2000);
  timer.callback();
  assert.equal(persisted['JHN.1.1'].note, 'My note');
  assert.equal(persisted['JHN.1.1'].noteTitle, 'Title');
  assert.equal(context.noteEditorDirty, false);
});

test('a standalone draft is saved and can be reopened without attaching a verse', () => {
  let html = '';
  const values = {};
  const content = { get innerHTML() { return html; }, set innerHTML(value) { html = value; }, get innerText() { return html.replace(/<[^>]+>/g, ''); }, style: { setProperty() {} }, focus() {} };
  let visible = false;
  const panel = { classList: { contains: () => visible } };
  const context = vm.createContext({
    noteEditorPanel: panel, noteEditorContent: content, noteEditorStandaloneKey: null, noteEditorVerseItems: [], noteEditorRemovedVerseKeys: new Set(), noteEditorAddingVerses: false,
    noteEditorSelectionRange: null, noteUppercaseUndo: [], noteEditorGroupId: '', noteEditorFontSize: 17, noteEditorNoteTitle: '', noteEditorDirty: false, noteAutosaveTimer: null,
    savedState: { notes: {} }, window: { clearTimeout() {}, setTimeout: () => 1 },
    escapeHtml: text => text, writeJson: (key, data) => { values[key] = data; }, refreshProfilePanel() {}, showModal() { visible = true; }, closeModal() { visible = false; },
  });
  vm.runInContext(readFileSync(new URL('../scripts/features/notes.js', import.meta.url), 'utf8'), context);
  context.sanitizeNoteHtml = html => html;
  context.renderNoteEditorVerseChips = () => {};
  context.emitNoteEditorChange = () => {};
  context.openStandaloneNote({ noteTitle: 'Faith', note: 'A personal draft.' });
  const key = context.noteEditorStandaloneKey;
  context.saveRichNote();
  assert.equal(values['brother.notes'][key].standalone, true);
  assert.equal(values['brother.notes'][key].note, 'A personal draft.');
  context.openStandaloneNote(values['brother.notes'][key]);
  assert.equal(context.noteEditorNoteTitle, 'Faith');
  assert.equal(content.innerText, 'A personal draft.');
});
