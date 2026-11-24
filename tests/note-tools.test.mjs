import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareNoteTool } from '../lib/routes/note-tools.js';

const fake = value => async options => {
  assert.equal(options.jsonMode, true);
  assert.match(options.input, /json/);
  return { text: JSON.stringify(value) };
};

test('note correction preserves the number of formatted text fragments', async () => {
  assert.deepEqual(await prepareNoteTool({ action: 'correct', segments: ['Bonjor ', 'monde'] }, fake({ segments: ['Bonjour ', 'monde'] })), { segments: ['Bonjour ', 'monde'] });
  await assert.rejects(prepareNoteTool({ action: 'correct', segments: ['one', 'two'] }, fake({ segments: ['one'] })), /safely/);
  await assert.rejects(prepareNoteTool({ action: 'correct', segments: ['x'.repeat(12001)] }, fake({})), /12,000/);
});

test('verse suggestions accept only bounded structured references', async () => {
  const result = await prepareNoteTool({ action: 'verses', segments: ['hope'] }, fake({ verses: [
    { bookId: 'JHN', chapter: 11, verse: 35, reason: 'Compassion' },
    { bookId: '<script>', chapter: 1, verse: 1, reason: 'invalid' },
    { bookId: 'GEN', chapter: 1, verse: -1, reason: 'invalid' },
  ] }));
  assert.deepEqual(result.verses, [{ bookId: 'JHN', chapter: 11, verse: 35, reason: 'Compassion' }]);
  await assert.rejects(prepareNoteTool({ action: 'verses', segments: ['hope'] }, async () => ({ text: '{}', incomplete: true })), /incomplete/);
});

test('adding suggestions preserves standalone drafts and refuses to overwrite another note', async () => {
  const vm = await import('node:vm');
  const { readFileSync } = await import('node:fs');
  let saved = 0;
  const context = vm.createContext({
    window: {}, noteEditorPanel: { classList: { contains: () => true } },
    noteEditorContent: { innerHTML: '<p>My note</p>' }, noteEditorGroupId: 'draft', noteEditorStandaloneKey: 'draft',
    noteEditorRemovedVerseKeys: new Set(), noteEditorVerseItems: [], savedState: { notes: { other: { note: 'Existing', noteGroupId: 'other-group' } } },
    saveRichNote: () => { saved++; }, emitNoteEditorChange() {},
  });
  vm.runInContext(readFileSync(new URL('../scripts/bridges/note-editor.js', import.meta.url), 'utf8'), context);
  context.installNoteEditorBridge();
  const original = { group: 'draft', html: '<p>My note</p>' };
  assert.throws(() => context.window.noteEditorBridge.addSuggestedVerses(original, [{ key: 'other' }]), /another note/);
  assert.equal(context.noteEditorStandaloneKey, 'draft');
  assert.equal(saved, 0);
  context.window.noteEditorBridge.addSuggestedVerses(original, [{ key: 'new-verse' }]);
  assert.equal(context.noteEditorStandaloneKey, null);
  assert.equal(context.noteEditorRemovedVerseKeys.has('draft'), true);
  assert.equal(context.noteEditorVerseItems[0].key, 'new-verse');
  assert.equal(saved, 1);
  assert.throws(() => context.window.noteEditorBridge.addSuggestedVerses({ ...original, html: 'old' }, [{ key: 'different' }]), /changed/);
});
