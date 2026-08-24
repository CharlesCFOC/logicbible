/* Notes module: toolbar commands, formatting, autosave and note actions. */

document.querySelectorAll("[data-note-command]").forEach((button) => {
  button.addEventListener("click", () => {
    noteEditorContent?.focus();
    document.execCommand(button.dataset.noteCommand, false, button.dataset.noteValue || null);
    markNoteEditorDirty();
  });
});

const noteColorInput = document.querySelector("[data-note-color]");
const noteHighlightInput = document.querySelector("[data-note-highlight]");
updateNoteColorSwatch(noteColorInput, "[data-note-color-swatch]");
updateNoteColorSwatch(noteHighlightInput, "[data-note-highlight-swatch]");

noteColorInput?.addEventListener("input", (event) => {
  updateNoteColorSwatch(event.target, "[data-note-color-swatch]");
  restoreNoteSelection();
  noteEditorContent?.focus();
  document.execCommand("foreColor", false, event.target.value);
  captureNoteSelection();
  markNoteEditorDirty();
});

noteHighlightInput?.addEventListener("input", (event) => {
  updateNoteColorSwatch(event.target, "[data-note-highlight-swatch]");
  restoreNoteSelection();
  noteEditorContent?.focus();
  document.execCommand("hiliteColor", false, event.target.value);
  captureNoteSelection();
  markNoteEditorDirty();
});

noteFontSizeInput?.addEventListener("input", (event) => {
  noteEditorFontSize = Number(event.target.value);
  markNoteEditorDirty();
  if (noteFontSizeValue) noteFontSizeValue.textContent = `${noteEditorFontSize} px`;
  const hasSelection = restoreNoteSelection() && noteEditorSelectionRange && !noteEditorSelectionRange.collapsed;
  if (hasSelection) {
    noteEditorContent?.focus();
    applySelectedNoteFontSize(noteEditorFontSize);
    captureNoteSelection();
  } else {
    noteEditorContent?.style.setProperty("--note-editor-font-size", `${noteEditorFontSize}px`);
  }
});

noteFontSizeDecreaseButton?.addEventListener("click", (event) => {
  changeNoteFontSize(-1, event.currentTarget);
});

noteFontSizeIncreaseButton?.addEventListener("click", (event) => {
  changeNoteFontSize(1, event.currentTarget);
});

[noteFontSizeDecreaseButton, noteFontSizeIncreaseButton].forEach((button) => {
  button?.addEventListener("pointerdown", () => {
    noteEditorCursorLine = getNoteCursorLine();
    captureNoteSelection();
  });
});

noteEditorContent?.addEventListener("input", markNoteEditorDirty);
noteEditorTitle?.addEventListener("input", (event) => {
  noteEditorNoteTitle = event.target.value;
  markNoteEditorDirty();
});
noteEditorContent?.addEventListener("mouseup", captureNoteSelection);
noteEditorContent?.addEventListener("keyup", captureNoteSelection);
noteEditorContent?.addEventListener("mouseup", updateNoteToolbarColors);
noteEditorContent?.addEventListener("keyup", updateNoteToolbarColors);
document.addEventListener("selectionchange", updateNoteToolbarColors);
noteFontSizeInput?.addEventListener("pointerdown", captureNoteSelection);

saveRichNoteButton?.addEventListener("click", () => {
  saveRichNote();
  resetNoteEditorDirty();
});
noteAddSaveButton?.addEventListener("click", saveAddedNoteVerses);
document.querySelector("[data-delete-rich-note]")?.addEventListener("click", deleteRichNote);
