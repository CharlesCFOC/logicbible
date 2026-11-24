// Adapter used by React; installed at the original bootstrap point.
function normalizeNotePickerColor(value, fallback) {
  const color = String(value || '').trim();
  if (/^#[0-9a-f]{6}$/i.test(color)) return color;
  const match = color.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  return match ? `#${match.slice(1, 4).map(part => Math.min(255, Number(part)).toString(16).padStart(2, '0')).join('')}` : fallback;
}
function installNoteEditorBridge() {
let dictationTarget = null;
window.noteEditorBridge = {
  openVoiceDraft(draft) { openStandaloneNote({ noteTitle: draft.title, note: draft.text }); },
  captureDictationTarget() {
    if (!noteEditorPanel?.classList.contains('is-visible') || !noteEditorContent) return false;
    const selection = window.getSelection();
    let range = selection?.rangeCount && noteEditorContent.contains(selection.getRangeAt(0).commonAncestorContainer) ? selection.getRangeAt(0).cloneRange() : document.createRange();
    if (!noteEditorContent.contains(range.commonAncestorContainer)) { range.selectNodeContents(noteEditorContent); range.collapse(false); }
    else range.collapse(false);
    dictationTarget = { range, html: noteEditorContent.innerHTML, group: noteEditorGroupId };
    return true;
  },
  insertDictation(text) {
    const target = dictationTarget;
    dictationTarget = null;
    if (!target || !noteEditorPanel?.classList.contains('is-visible') || target.group !== noteEditorGroupId || target.html !== noteEditorContent.innerHTML || !noteEditorContent.contains(target.range.commonAncestorContainer)) return false;
    const range = target.range;
    const before = document.createRange(); before.selectNodeContents(noteEditorContent); before.setEnd(range.startContainer, range.startOffset);
    const after = document.createRange(); after.selectNodeContents(noteEditorContent); after.setStart(range.startContainer, range.startOffset);
    const left = before.toString(), right = after.toString();
    const words = String(text || '').trim();
    if (!words) return false;
    const prefix = left && !/\s$/.test(left) && !/^[.,!?;:]/.test(words) ? ' ' : '';
    const suffix = right && !/^\s|^[.,!?;:]/.test(right) && !/\s$/.test(words) ? ' ' : '';
    const insertion = prefix + words + suffix;
    noteEditorContent.focus();
    const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
    if (!document.execCommand('insertText', false, insertion)) {
      const node = document.createTextNode(insertion); range.insertNode(node); range.setStartAfter(node); range.collapse(true); selection.removeAllRanges(); selection.addRange(range);
    }
    markNoteEditorDirty();
    emitNoteEditorChange();
    return true;
  },
  getDocument() {
    const walker = document.createTreeWalker(noteEditorContent, NodeFilter.SHOW_TEXT);
    const segments = [];
    while (walker.nextNode()) segments.push(walker.currentNode.nodeValue);
    return { title: noteEditorNoteTitle, html: noteEditorContent.innerHTML, safeHtml: sanitizeNoteHtml(noteEditorContent.innerHTML), segments, group: noteEditorGroupId, items: noteEditorVerseItems.map(item => ({ ...item })) };
  },
  async requestAi(action, segments) {
    const response = await aiFetch(apiUrl('/api/ai/note-tools'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, segments }) });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result) throw new Error(result?.error || 'The AI request failed. Please try again.');
    return result;
  },
  applyCorrection(original, corrected) {
    if (!noteEditorPanel.classList.contains('is-visible') || noteEditorGroupId !== original.group || noteEditorContent.innerHTML !== original.html) throw new Error('The note changed. Please request a new correction.');
    const walker = document.createTreeWalker(noteEditorContent, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    if (nodes.length !== corrected.length) throw new Error('The note changed. Please request a new correction.');
    nodes.forEach((node, index) => { node.nodeValue = corrected[index]; });
    markNoteEditorDirty();
    emitNoteEditorChange();
  },
  async resolveSuggestedVerses(suggestions) {
    const version = getVersion(readerState.versionId);
    const remoteVersion = version.source === 'local' ? getRemoteFallbackVersion(version.id) : version;
    const matches = await Promise.all(suggestions.map(async suggestion => {
      const book = BOOKS.find(item => item.id === suggestion.bookId);
      if (!book || suggestion.chapter > book.chapters) return null;
      const local = version.source === 'local' && LOCAL_BIBLE[version.id]?.[`${book.id}.${suggestion.chapter}`];
      let verses;
      let label = version.abbreviation;
      if (local) verses = local.verses.map((text, index) => ({ number: index + 1, text }));
      else if (remoteVersion) {
        const params = new URLSearchParams({ bibleId: remoteVersion.id, bookId: book.id, chapter: String(suggestion.chapter) });
        const response = await fetch(apiUrl(`/api/bible/chapter?${params}`));
        if (!response.ok) return null;
        const payload = await response.json();
        verses = normalizeApiChapter(payload.data, remoteVersion).verses;
        label = remoteVersion.abbreviation;
      } else return null;
      const verse = verses.find(item => Number(item.number) === suggestion.verse);
      if (!verse?.text) return null;
      const key = getVersionedVerseKey(book.id, suggestion.chapter, suggestion.verse, label);
      return { key, bookId: book.id, chapter: suggestion.chapter, number: suggestion.verse, version: label, text: verse.text, reference: `${book.name} ${suggestion.chapter}:${suggestion.verse}`, reason: suggestion.reason };
    }).map(promise => promise.catch(() => null)));
    return matches.filter((item, index) => item && matches.findIndex(other => other?.key === item.key) === index);
  },
  addSuggestedVerses(original, verses) {
    if (!noteEditorPanel.classList.contains('is-visible') || noteEditorGroupId !== original.group || noteEditorContent.innerHTML !== original.html) throw new Error('The note changed. Please request new suggestions.');
    const additions = verses.filter(item => !noteEditorVerseItems.some(existing => existing.key === item.key));
    if (additions.some(item => savedState.notes[item.key] && savedState.notes[item.key].noteGroupId !== noteEditorGroupId)) throw new Error('One of these verses already has another note. Unselect it to keep both notes.');
    if (!additions.length) return;
    if (noteEditorStandaloneKey) {
      noteEditorRemovedVerseKeys.add(noteEditorStandaloneKey);
      noteEditorStandaloneKey = null;
    }
    noteEditorVerseItems = [...noteEditorVerseItems, ...additions];
    saveRichNote();
    emitNoteEditorChange();
  },
  attachContent(element) {
    noteEditorContent = element;
  },
  getContentHtml() {
    return noteEditorContent?.innerHTML || "<p><br></p>";
  },
  contentChanged(html) {
    if (noteEditorContent && noteEditorContent.innerHTML !== html) noteEditorContent.innerHTML = html;
    markNoteEditorDirty();
    captureNoteSelection();
    updateNoteToolbarColors();
    emitNoteEditorChange();
  },
  getSnapshot() {
    const textInput = document.querySelector("[data-note-color]");
    const highlightInput = document.querySelector("[data-note-highlight]");
    const element = getNoteCaretElement();
    const textColor = element ? window.getComputedStyle(element).color : (textInput?.value || "#ffffff");
    const backgroundColor = element ? getNoteHighlightColor(element) : (highlightInput?.value || "#facc15");
    return {
      textColor: normalizeNotePickerColor(textColor, textInput?.value || "#ffffff"),
      highlightColor: normalizeNotePickerColor(backgroundColor, highlightInput?.value || "#facc15"),
      fontSize: noteEditorFontSize,
      uppercaseActive: noteSelectionIsUppercase(),
    };
  },
  command(name, value = null) {
    if (name === "undo" && undoNoteUppercase()) return;
    noteEditorContent?.focus();
    document.execCommand(name, false, value);
    markNoteEditorDirty();
    updateNoteToolbarColors();
  },
  captureSelection() { captureNoteSelection(); },
  uppercaseSelection() { uppercaseNoteSelection(); },
  undoUppercase() { return undoNoteUppercase(); },
  color(type, value) {
    const selector = type === "highlight" ? "[data-note-highlight]" : "[data-note-color]";
    const input = document.querySelector(selector);
    if (input) input.value = value;
    restoreNoteSelection();
    noteEditorContent?.focus();
    document.execCommand(type === "highlight" ? "hiliteColor" : "foreColor", false, value);
    captureNoteSelection();
    markNoteEditorDirty();
    updateNoteToolbarColors();
  },
  changeSize(delta) {
    changeNoteFontSize(delta);
    emitNoteToolbarChange();
  },
  getEditorSnapshot() {
    return {
      title: noteEditorNoteTitle,
      items: noteEditorVerseItems.map((item) => ({ ...item })),
      addingVerses: noteEditorAddingVerses,
    };
  },
  setTitle(value) {
    noteEditorNoteTitle = value;
    markNoteEditorDirty();
    emitNoteEditorChange();
  },
  save() {
    saveRichNote();
    resetNoteEditorDirty();
    emitNoteEditorChange();
  },
  delete() {
    deleteRichNote();
    emitNoteEditorChange();
  },
  close() {
    closeModal();
    emitNoteEditorChange();
  },
  startAdding() {
    startAddingNoteVerses();
    emitNoteEditorChange();
  },
  removeVerse(key) {
    removeNoteEditorVerse(key);
  },
};
}
