import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

test('note color controls convert computed RGB colors into valid picker values', () => {
  const context = vm.createContext({});
  vm.runInContext(readFileSync(new URL('../scripts/bridges/note-editor.js', import.meta.url), 'utf8'), context);
  assert.equal(context.normalizeNotePickerColor('rgb(17, 128, 255)', '#ffffff'), '#1180ff');
  assert.equal(context.normalizeNotePickerColor('#aabbcc', '#ffffff'), '#aabbcc');
  assert.equal(context.normalizeNotePickerColor('transparent', '#facc15'), '#facc15');
});
