import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

function setup({ text = ['bonjour ', 'monde'], start = 3, end = 3, collapsed = false, separateBlocks = false } = {}) {
  const block = {};
  const makeNode = data => ({ nodeType: 3, data, parentElement: { closest: () => block }, get length() { return this.data.length; }, replaceData(offset, length, value) { this.data = this.data.slice(0, offset) + value + this.data.slice(offset + length); } });
  const nodes = text.map(makeNode);
  if (separateBlocks) nodes.forEach(node => { const line = {}; node.parentElement.closest = () => line; });
  const inside = {};
  function makeRange() {
    return {
      collapsed, commonAncestorContainer: inside, startContainer: nodes[0], startOffset: start, endContainer: nodes.at(-1), endOffset: end,
      intersectsNode(node) { return nodes.indexOf(node) >= nodes.indexOf(this.startContainer) && nodes.indexOf(node) <= nodes.indexOf(this.endContainer); },
      setStart(node, offset) { this.startContainer = node; this.startOffset = offset; },
      setEnd(node, offset) { this.endContainer = node; this.endOffset = offset; },
      cloneRange() { return this; },
      toString() { return nodes.slice(nodes.indexOf(this.startContainer), nodes.indexOf(this.endContainer) + 1).map((node, i, selected) => node.data.slice(i === 0 ? this.startOffset : 0, i === selected.length - 1 ? this.endOffset : undefined)).join(''); },
    };
  }
  let range = makeRange();
  const selection = { rangeCount: 1, isCollapsed: collapsed, anchorNode: inside, getRangeAt: () => range, removeAllRanges() {}, addRange(value) { range = value; } };
  let dirty = 0;
  let restored = null;
  const content = { contains: node => node === inside || nodes.includes(node), focus() {}, get innerHTML() { return restored ?? `<p style="text-align:center"><span style="color:red">${nodes[0].data}</span><span style="background:yellow">${nodes[1].data}</span></p>`; }, set innerHTML(html) { restored = html; } };
  const context = vm.createContext({
    noteEditorContent: content, noteEditorSelectionRange: null, noteUppercaseUndo: [],
    window: { getSelection: () => selection }, NodeFilter: { SHOW_TEXT: 4 }, Node: { TEXT_NODE: 3 },
    document: { createRange: makeRange, createTreeWalker: () => { let index = 0; return { nextNode: () => nodes[index++] || null }; } },
  });
  vm.runInContext(readFileSync(new URL('../scripts/features/notes.js', import.meta.url), 'utf8'), context);
  context.markNoteEditorDirty = () => { dirty++; };
  context.updateNoteToolbarColors = () => {};
  return { context, content, nodes, dirty: () => dirty };
}

test('uppercase preserves formatting and selected text; second click returns it to lowercase', () => {
  const h = setup();
  const original = h.content.innerHTML;
  assert.equal(h.context.uppercaseNoteSelection(), true);
  assert.equal(h.content.innerHTML, '<p style="text-align:center"><span style="color:red">bonJOUR </span><span style="background:yellow">MONde</span></p>');
  assert.equal(h.context.noteSelectionIsUppercase(), true);
  assert.equal(h.context.uppercaseNoteSelection(), true);
  assert.equal(h.content.innerHTML, original);
  assert.equal(h.context.noteSelectionIsUppercase(), false);
  assert.equal(h.dirty(), 2);
});

test('lowercasing preserves the start of each sentence across formatted text', () => {
  const h = setup({ text: ['BONJOUR. ', 'MONDE ! ENCORE'], start: 0, end: 14 });
  assert.equal(h.context.uppercaseNoteSelection(), true);
  assert.equal(h.nodes[0].data, 'Bonjour. ');
  assert.equal(h.nodes[1].data, 'Monde ! Encore');
  assert.equal(h.context.undoNoteUppercase(), true);
  assert.match(h.content.innerHTML, /BONJOUR/);
});

test('uppercase does nothing if no text is selected', () => {
  const h = setup({ collapsed: true });
  assert.equal(h.context.uppercaseNoteSelection(), false);
  assert.equal(h.dirty(), 0);
});

test('a new paragraph starts with a capital even when the preceding paragraph has no punctuation', () => {
  const h = setup({ text: ['PREMIÈRE LIGNE', 'SECONDE LIGNE'], start: 0, end: 13, separateBlocks: true });
  h.context.uppercaseNoteSelection();
  assert.equal(h.nodes[0].data, 'Première ligne');
  assert.equal(h.nodes[1].data, 'Seconde ligne');
});

test('selection survives uppercase characters that expand in length', () => {
  const h = setup({ text: ['straße', ' suite'], start: 0, end: 0 });
  h.context.uppercaseNoteSelection();
  assert.equal(h.nodes[0].data, 'STRASSE');
  assert.equal(h.context.noteSelectionIsUppercase(), true);
  h.context.uppercaseNoteSelection();
  assert.equal(h.nodes[0].data, 'Strasse');
});
