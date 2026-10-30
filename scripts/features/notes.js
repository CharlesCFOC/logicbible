// Legacy features/notes: loaded before script.js; declarations only.
// Shared state remains in script.js during the incremental React migration.

function getSaveRichNoteButton() {
  return document.querySelector("[data-save-rich-note]") || saveRichNoteButton;
}

function markNoteEditorDirty() {
  getSaveRichNoteButton()?.classList.add("is-dirty");
  window.clearTimeout(noteAutosaveTimer);
  noteAutosaveTimer = window.setTimeout(() => {
    if (noteEditorPanel?.classList.contains("is-visible") && getSaveRichNoteButton()?.classList.contains("is-dirty")) {
      saveRichNote();
    }
  }, 2000);
}

function resetNoteEditorDirty() {
  getSaveRichNoteButton()?.classList.remove("is-dirty");
  window.clearTimeout(noteAutosaveTimer);
  noteAutosaveTimer = null;
}

function showNoteEditor() {
  const currentNote = savedState.notes[selectedVerseData.key]?.note || "";
  verseDetail.hidden = false;
  verseDetail.innerHTML = `
    <label class="note-editor">
      <span>Note</span>
      <textarea data-note-input>${escapeHtml(currentNote)}</textarea>
    </label>
    <button class="primary-button" data-save-note>Save Note</button>
  `;
  verseDetail.querySelector("[data-save-note]").addEventListener("click", () => {
    const note = verseDetail.querySelector("[data-note-input]").value.trim();
    const items = multiSelectedVerseData.length ? multiSelectedVerseData : [selectedVerseData];
    if (note) {
      items.forEach((item) => {
        savedState.notes[item.key] = {
          ...item,
          note,
          updatedAt: new Date().toISOString(),
        };
        document.querySelectorAll(`[data-verse-key="${CSS.escape(item.key)}"]`).forEach((line) => line.classList.add("is-noted"));
      });
      setFeedback(`Note saved to ${items.length} verse${items.length === 1 ? "" : "s"}.`);
    } else {
      items.forEach((item) => {
        delete savedState.notes[item.key];
        document.querySelectorAll(`[data-verse-key="${CSS.escape(item.key)}"]`).forEach((line) => line.classList.remove("is-noted"));
      });
      setFeedback(`Note${items.length === 1 ? "" : "s"} cleared.`);
    }
    writeJson("brother.notes", savedState.notes);
    refreshProfilePanel();
    if (multiSelectedVerseData.length) exitMultiSelectMode();
  });
  verseDetail.querySelector("[data-note-input]").focus();
}

function sanitizeNoteHtml(html) {
  const template = document.createElement("template");
  template.innerHTML = String(html || "");
  const allowed = new Set(["B", "STRONG", "I", "EM", "U", "P", "BR", "H2", "H3", "UL", "OL", "LI", "DIV", "SPAN"]);
  template.content.querySelectorAll("*").forEach((element) => {
    if (element.tagName === "FONT") {
      const level = Number(element.getAttribute("size") || 4);
      const size = [14, 16, 18, 21, 25, 28, 30][Math.min(7, Math.max(1, level)) - 1];
      const span = document.createElement("span");
      const color = element.getAttribute("color") || element.style.color;
      const backgroundColor = element.style.backgroundColor;
      const fontSize = element.style.fontSize || `${size}px`;
      if (color) span.style.color = color;
      if (backgroundColor) span.style.backgroundColor = backgroundColor;
      if (fontSize) span.style.fontSize = fontSize;
      span.innerHTML = element.innerHTML;
      element.replaceWith(span);
      return;
    }
    if (!allowed.has(element.tagName)) {
      element.replaceWith(...element.childNodes);
      return;
    }
    [...element.attributes].forEach((attribute) => {
      if (attribute.name !== "style") {
        element.removeAttribute(attribute.name);
      }
    });
    if (element.hasAttribute("style")) {
      const color = element.style.color;
      const backgroundColor = element.style.backgroundColor;
      const textAlign = element.style.textAlign;
      const fontSize = element.style.fontSize;
      element.removeAttribute("style");
      if (color) element.style.color = color;
      if (backgroundColor) element.style.backgroundColor = backgroundColor;
      if (textAlign) element.style.textAlign = textAlign;
      if (fontSize) element.style.fontSize = fontSize;
    }
  });
  return template.innerHTML;
}

function getNoteSelectionItems() {
  if (noteEditorPanel?.classList.contains("is-visible")) {
    return noteEditorVerseItems;
  }
  return multiSelectedVerseData.length ? multiSelectedVerseData : selectedVerseData ? [selectedVerseData] : [];
}

function getNoteGroupItems(item) {
  const note = savedState.notes[item?.key];
  if (!note) {
    return [item].filter(Boolean);
  }

  const sameGroup = note.noteGroupId
    ? Object.values(savedState.notes).filter((entry) => entry?.noteGroupId === note.noteGroupId)
    : Object.values(savedState.notes).filter((entry) => (
      entry?.noteHtml && note.noteHtml
        ? entry.noteHtml === note.noteHtml
        : entry?.note === note.note
    ));

  const groupKeys = new Set(sameGroup.map((entry) => entry.key));
  const groupItems = sameGroup
    .filter((entry) => groupKeys.has(entry.key))
    .map((entry) => ({ ...entry }));
  return groupItems.length ? groupItems : [item].filter(Boolean);
}

function emitNoteEditorChange() {
  document.dispatchEvent(new CustomEvent("note:editor-change"));
}

function removeNoteEditorVerse(key) {
  const removed = noteEditorVerseItems.find((item) => item.key === key);
  noteEditorVerseItems = noteEditorVerseItems.filter((item) => item.key !== key);
  noteEditorRemovedVerseKeys.add(key);
  markNoteEditorDirty();
  multiSelectedVerseData = multiSelectedVerseData.filter((item) => item.key !== key);
  if (selectedVerseData?.key === key) {
    selectedVerseData = noteEditorVerseItems[0] || null;
  }
  renderNoteEditorVerseChips();
  if (noteEditorReference) noteEditorReference.value = noteEditorNoteTitle;
  if (noteEditorStatus) {
    noteEditorStatus.textContent = noteEditorVerseItems.length
      ? `This note will be saved to ${noteEditorVerseItems.length} verse${noteEditorVerseItems.length === 1 ? "" : "s"}.`
      : "";
  }
  emitNoteEditorChange();
  setFeedback(removed ? `${removed.reference} removed from the note.` : "Verse removed from the note.");
}

function renderNoteEditorVerseChips() {
  if (!noteEditorVerseChips) {
    return;
  }
  const verseCount = noteEditorVerseItems.length;
  noteEditorVerseChips.innerHTML = `
    <button type="button" class="note-editor-verse-summary" data-note-verses-toggle aria-expanded="false">
      <span class="note-editor-verse-summary-copy">
        <strong>View verses</strong>
      </span>
      <i data-lucide="chevron-down" aria-hidden="true"></i>
    </button>
    <div class="note-editor-verse-menu" data-note-verse-menu hidden>
      <button type="button" class="note-editor-add-verse" data-add-note-verse><span aria-hidden="true">+</span> Add verse</button>
      ${noteEditorVerseItems.length
        ? noteEditorVerseItems.map((item) => `
          <article class="note-editor-verse-item">
            <div class="note-editor-verse-item-heading">
              <strong>${escapeHtml(item.reference)}</strong>
              <button type="button" data-remove-note-verse="${escapeAttr(item.key)}" aria-label="Remove ${escapeAttr(item.reference)} from note">×</button>
            </div>
            <p>${escapeHtml(item.text || "Verse text unavailable.")}</p>
          </article>
        `).join("")
        : '<span class="note-editor-no-verses">No verses attached</span>'}
    </div>
  `;
  refreshIcons();
  emitNoteEditorChange();

  noteEditorVerseChips.querySelector("[data-note-verses-toggle]")?.addEventListener("click", () => {
    const toggle = noteEditorVerseChips.querySelector("[data-note-verses-toggle]");
    const menu = noteEditorVerseChips.querySelector("[data-note-verse-menu]");
    const isExpanded = toggle?.getAttribute("aria-expanded") === "true";
    toggle?.setAttribute("aria-expanded", String(!isExpanded));
    if (menu) menu.hidden = isExpanded;
    toggle?.querySelector("svg")?.classList.toggle("is-open", !isExpanded);
  });
  noteEditorVerseChips.querySelector("[data-add-note-verse]")?.addEventListener("click", startAddingNoteVerses);

  noteEditorVerseChips.querySelectorAll("[data-remove-note-verse]").forEach((button) => {
    button.addEventListener("click", () => {
      removeNoteEditorVerse(button.dataset.removeNoteVerse);
    });
  });
}

function startAddingNoteVerses() {
  if (!noteEditorVerseItems.length) {
    return;
  }
  noteEditorAddingVerses = true;
  multiSelectMode = true;
  multiSelectedVerseData = [...noteEditorVerseItems];
  selectedVerseData = multiSelectedVerseData[0];
  updateMultiSelectionUi();
  closeModal({ preserveNoteAddMode: true });
  setFeedback("Tap other verses to add them to this note, then open the note menu.");
}

function saveAddedNoteVerses() {
  if (!noteEditorAddingVerses || !multiSelectedVerseData.length) return;
  noteEditorVerseItems = [...multiSelectedVerseData];
  noteEditorAddingVerses = false;
  updateMultiSelectionUi();
  openRichNoteEditor();
  saveRichNote();
  setFeedback("Verses added and note saved.");
}

function openRichNoteEditor() {
  if (!noteEditorPanel || !noteEditorContent) {
    return;
  }
  const selectedItems = getNoteSelectionItems();
  const selectedExistingNote = selectedItems.length === 1 && savedState.notes[selectedItems[0].key];
  const items = selectedExistingNote ? getNoteGroupItems(selectedItems[0]) : selectedItems;
  if (!items.length) {
    return;
  }
  const wasAddingVerses = noteEditorAddingVerses;
  noteEditorVerseItems = [...items];
  noteEditorAddingVerses = false;
  noteEditorRemovedVerseKeys = new Set();
  noteEditorSelectionRange = null;
  renderNoteEditorVerseChips();
  const existing = items.find((item) => savedState.notes[item.key]?.noteHtml || savedState.notes[item.key]?.note)?.key;
  const note = existing ? savedState.notes[existing] : null;
  noteEditorGroupId = note?.noteGroupId || `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  noteEditorFontSize = Number(note?.noteFontSize || 17);
  noteEditorNoteTitle = note?.noteTitle || "";
  if (noteEditorTitle) noteEditorTitle.value = noteEditorNoteTitle;
  if (noteFontSizeInput) noteFontSizeInput.value = String(noteEditorFontSize);
  if (noteFontSizeValue) noteFontSizeValue.textContent = `${noteEditorFontSize} px`;
  noteEditorContent.style.setProperty("--note-editor-font-size", `${noteEditorFontSize}px`);
  if (noteEditorReference) noteEditorReference.value = noteEditorNoteTitle;
  noteEditorContent.innerHTML = sanitizeNoteHtml(note?.noteHtml || (note?.note ? `<p>${escapeHtml(note.note)}</p>` : "<p><br></p>"));
  if (getSaveRichNoteButton()) {
    getSaveRichNoteButton().setAttribute("aria-label", "Save note");
    getSaveRichNoteButton().title = "Save note";
  }
  resetNoteEditorDirty();
  if (wasAddingVerses) {
    markNoteEditorDirty();
  }
  if (noteEditorStatus) {
    noteEditorStatus.textContent = `This note will be saved to ${items.length} verse${items.length === 1 ? "" : "s"}.`;
  }
  showModal(noteEditorPanel);
  noteEditorContent.focus();
  emitNoteEditorChange();
}

function saveRichNote() {
  const items = getNoteSelectionItems();
  if (!noteEditorContent) {
    return;
  }
  noteEditorRemovedVerseKeys.forEach((key) => {
    delete savedState.notes[key];
    document.querySelectorAll(`[data-verse-key="${CSS.escape(key)}"]`).forEach((line) => line.classList.remove("is-noted"));
  });
  if (!items.length) {
    writeJson("brother.notes", savedState.notes);
    resetNoteEditorDirty();
    return;
  }
  const noteHtml = sanitizeNoteHtml(noteEditorContent.innerHTML);
  const noteText = noteEditorContent.innerText.trim();
  const noteGroupId = noteEditorGroupId || `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  items.forEach((item) => {
    if (!noteText) {
      delete savedState.notes[item.key];
      document.querySelectorAll(`[data-verse-key="${CSS.escape(item.key)}"]`).forEach((line) => line.classList.remove("is-noted"));
      return;
    }
    savedState.notes[item.key] = {
      ...item,
      note: noteText,
      noteHtml,
      noteTitle: noteEditorNoteTitle.trim(),
      noteFontSize: noteEditorFontSize,
      noteGroupId,
      updatedAt: new Date().toISOString(),
    };
    document.querySelectorAll(`[data-verse-key="${CSS.escape(item.key)}"]`).forEach((line) => line.classList.add("is-noted"));
  });
  writeJson("brother.notes", savedState.notes);
  refreshProfilePanel();
  setFeedback(`Note saved to ${items.length} verse${items.length === 1 ? "" : "s"}.`);
  if (getSaveRichNoteButton()) {
    getSaveRichNoteButton().setAttribute("aria-label", "Saved");
    getSaveRichNoteButton().title = "Saved";
    getSaveRichNoteButton().classList.add("is-saved");
    window.setTimeout(() => {
      if (getSaveRichNoteButton()) {
        getSaveRichNoteButton().setAttribute("aria-label", "Save note");
        getSaveRichNoteButton().title = "Save note";
        getSaveRichNoteButton().classList.remove("is-saved");
      }
    }, 1600);
  }
  noteEditorRemovedVerseKeys = new Set();
  resetNoteEditorDirty();
}

function deleteRichNote() {
  const items = noteEditorVerseItems;
  if (!items.length || !window.confirm("Delete this note from all attached verses?")) {
    return;
  }
  items.forEach((item) => {
    delete savedState.notes[item.key];
    document.querySelectorAll(`[data-verse-key="${CSS.escape(item.key)}"]`).forEach((line) => line.classList.remove("is-noted"));
  });
  writeJson("brother.notes", savedState.notes);
  refreshProfilePanel();
  setFeedback(`Note deleted from ${items.length} verse${items.length === 1 ? "" : "s"}.`);
  closeModal();
  exitMultiSelectMode();
}

function captureNoteSelection() {
  if (!noteEditorContent) return;
  const selection = window.getSelection();
  if (!selection?.rangeCount || selection.isCollapsed) return;
  const range = selection.getRangeAt(0);
  if (noteEditorContent.contains(range.commonAncestorContainer)) {
    noteEditorSelectionRange = range.cloneRange();
    const selectedSize = getSelectedNoteFontSize();
    if (selectedSize) {
      noteEditorFontSize = selectedSize;
      if (noteFontSizeInput) noteFontSizeInput.value = String(selectedSize);
      if (noteFontSizeValue) noteFontSizeValue.textContent = `${selectedSize} px`;
    }
  }
}

function restoreNoteSelection() {
  if (!noteEditorSelectionRange) return false;
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(noteEditorSelectionRange);
  return true;
}

function getSelectedNoteFontSize() {
  const selection = window.getSelection();
  if (!selection?.rangeCount || selection.isCollapsed) return null;
  const node = selection.anchorNode?.nodeType === Node.TEXT_NODE
    ? selection.anchorNode.parentElement
    : selection.anchorNode;
  if (!node || !noteEditorContent?.contains(node)) return null;
  const size = Number.parseFloat(window.getComputedStyle(node).fontSize);
  return Number.isFinite(size) ? Math.round(Math.min(30, Math.max(14, size))) : null;
}

function applySelectedNoteFontSize(size) {
  if (!restoreNoteSelection() || !noteEditorSelectionRange || noteEditorSelectionRange.collapsed) {
    return false;
  }

  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
    ? range.commonAncestorContainer.parentElement
    : range.commonAncestorContainer;
  const existing = container?.closest?.("[data-note-font-size]");
  if (existing && noteEditorContent.contains(existing) && range.toString() === existing.textContent) {
    existing.style.fontSize = `${size}px`;
  } else {
    const fragment = range.extractContents();
    const span = document.createElement("span");
    span.dataset.noteFontSize = "true";
    span.style.fontSize = `${size}px`;
    span.appendChild(fragment);
    range.insertNode(span);
    const nextRange = document.createRange();
    nextRange.selectNodeContents(span);
    selection.removeAllRanges();
    selection.addRange(nextRange);
  }
  noteEditorSelectionRange = selection.getRangeAt(0).cloneRange();
  return true;
}

function updateNoteColorSwatch(input, selector) {
  input?.closest("label")?.querySelector(selector)?.style.setProperty("background", input.value);
}

function getNoteCaretElement() {
  const selection = window.getSelection();
  if (!selection?.rangeCount || !noteEditorContent?.contains(selection.anchorNode)) return null;
  return selection.anchorNode.nodeType === Node.ELEMENT_NODE
    ? selection.anchorNode
    : selection.anchorNode.parentElement;
}

function getNoteHighlightColor(element) {
  let current = element;
  while (current && current !== noteEditorContent) {
    const color = window.getComputedStyle(current).backgroundColor;
    if (color && color !== "transparent" && color !== "rgba(0, 0, 0, 0)") return color;
    current = current.parentElement;
  }
  return "transparent";
}

function updateNoteToolbarColors() {
  const element = getNoteCaretElement();
  if (!element) {
    emitNoteToolbarChange();
    return;
  }
  const textColor = window.getComputedStyle(element).color || "#ffffff";
  const highlightColor = getNoteHighlightColor(element);
  const textLabel = noteColorInput?.closest("label");
  const highlightLabel = noteHighlightInput?.closest("label");
  const textSwatch = textLabel?.querySelector("[data-note-color-swatch]");
  const highlightSwatch = highlightLabel?.querySelector("[data-note-highlight-swatch]");
  textSwatch?.style.setProperty("background", textColor);
  highlightSwatch?.style.setProperty("background", highlightColor);
  textLabel?.style.setProperty("color", textColor);
  highlightLabel?.style.setProperty("color", highlightColor === "transparent" ? "#d9f2ff" : highlightColor);
  emitNoteToolbarChange();
}

function emitNoteToolbarChange() {
  document.dispatchEvent(new CustomEvent("note:toolbar-change"));
}

function getNoteCursorLine() {
  const selection = window.getSelection();
  if (!selection?.rangeCount || !noteEditorContent?.contains(selection.anchorNode)) return null;
  const node = selection.anchorNode.nodeType === Node.ELEMENT_NODE
    ? selection.anchorNode
    : selection.anchorNode.parentElement;
  const line = node?.closest("p, li, h1, h2, h3, h4, h5, h6, div");
  return line && line !== noteEditorContent ? line : null;
}

function applyNoteFontSizeToLine(line, size) {
  if (!line) return;
  const computed = window.getComputedStyle(line);
  const marginTop = computed.marginTop;
  const marginBottom = computed.marginBottom;
  line.style.fontSize = `${size}px`;
  line.style.lineHeight = "1.2";
  line.style.marginTop = marginTop;
  line.style.marginBottom = marginBottom;
  line.querySelectorAll("*").forEach((element) => {
    if (element.tagName !== "BR") element.style.fontSize = `${size}px`;
  });
}

function changeNoteFontSize(delta, trigger) {
  const hasSelection = restoreNoteSelection() && noteEditorSelectionRange && !noteEditorSelectionRange.collapsed;
  const line = hasSelection ? null : (noteEditorCursorLine || getNoteCursorLine());
  const currentSize = line ? Number.parseFloat(window.getComputedStyle(line).fontSize) || noteEditorFontSize : noteEditorFontSize;
  noteEditorFontSize = Math.min(30, Math.max(14, currentSize + delta * 3));
  markNoteEditorDirty();
  trigger?.setAttribute("aria-label", `Text size ${noteEditorFontSize} pixels`);
  trigger?.setAttribute("title", `Text size: ${noteEditorFontSize}px`);

  if (hasSelection) {
    noteEditorContent?.focus();
    applySelectedNoteFontSize(noteEditorFontSize);
    captureNoteSelection();
  } else if (line) {
    applyNoteFontSizeToLine(line, noteEditorFontSize);
  } else {
    noteEditorContent?.style.setProperty("--note-editor-font-size", `${noteEditorFontSize}px`);
  }
  noteEditorCursorLine = null;
}

function persistNotesBeforeBackground() {
  if (noteEditorPanel?.classList.contains("is-visible")) {
    saveRichNote();
  }
  syncPendingState();
}
