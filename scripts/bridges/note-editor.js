// Adapter used by React; installed at the original bootstrap point.
function installNoteEditorBridge() {
window.noteEditorBridge = {
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
      textColor,
      highlightColor: backgroundColor === "transparent" ? (highlightInput?.value || "#facc15") : backgroundColor,
      fontSize: noteEditorFontSize,
    };
  },
  command(name, value = null) {
    noteEditorContent?.focus();
    document.execCommand(name, false, value);
    markNoteEditorDirty();
    updateNoteToolbarColors();
  },
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
