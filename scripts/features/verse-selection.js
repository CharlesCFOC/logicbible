// Legacy features/verse-selection: loaded before script.js; declarations only.
// Shared state remains in script.js during the incremental React migration.

function updateMultiSelectionUi() {
  const selectedKeys = new Set(multiSelectedVerseData.map((item) => item.highlightKey));
  document.querySelectorAll(".scripture-line, .parallel-scripture-line").forEach((line) => {
    line.classList.toggle("is-multi-selected", selectedKeys.has(line.dataset.highlightKey));
  });
  if (multiSelectMenuToggle) {
    multiSelectMenuToggle.hidden = !multiSelectMode || !multiSelectedVerseData.length;
  }
  if (noteAddSaveButton) {
    noteAddSaveButton.hidden = !noteEditorAddingVerses || !multiSelectedVerseData.length;
  }
  if (multiSelectMode && selectedVerse) {
    selectedVerse.textContent = `${multiSelectedVerseData.length} verses selected`;
  }
  emitBibleVerseUiChange();
}

function startMultiSelect(verse) {
  multiSelectMode = true;
  multiSelectedVerseData = [getVerseDataFromElement(verse)];
  selectedVerseData = multiSelectedVerseData[0];
  updateMultiSelectionUi();
  setFeedback("Tap other verses to select them.");
}

function toggleMultiSelectedVerse(verse) {
  const data = getVerseDataFromElement(verse);
  toggleMultiSelectedData(data);
}

function toggleMultiSelectedData(data) {
  const existingIndex = multiSelectedVerseData.findIndex((item) => item.highlightKey === data.highlightKey);
  if (existingIndex >= 0) {
    multiSelectedVerseData.splice(existingIndex, 1);
  } else {
    multiSelectedVerseData.push(data);
  }
  if (!multiSelectedVerseData.length) {
    multiSelectMode = false;
    multiSelectMenuToggle && (multiSelectMenuToggle.hidden = true);
    hideVerseDetail();
  } else {
    selectedVerseData = multiSelectedVerseData[0];
  }
  updateMultiSelectionUi();
}

function exitMultiSelectMode() {
  multiSelectMode = false;
  multiSelectedVerseData = [];
  document.querySelectorAll(".scripture-line.is-multi-selected, .parallel-scripture-line.is-multi-selected").forEach((line) => line.classList.remove("is-multi-selected"));
  if (multiSelectMenuToggle) multiSelectMenuToggle.hidden = true;
  if (noteAddSaveButton) noteAddSaveButton.hidden = true;
}

function closeNoteTooltips() {
  document.querySelectorAll(".verse-note-tooltip").forEach((tooltip) => tooltip.remove());
}

function showNoteTooltip(verse, verseData) {
  closeNoteTooltips();
  const note = savedState.notes[verseData.key];
  if (!note?.note) {
    return;
  }

  const tooltip = document.createElement("div");
  tooltip.className = "verse-note-tooltip";
  tooltip.innerHTML = `
    <span class="verse-note-tooltip-label">Saved note</span>
    <p>${escapeHtml(note.note)}</p>
    <button type="button" data-open-saved-note>Open note</button>
  `;
  tooltip.addEventListener("click", (event) => event.stopPropagation());
  tooltip.querySelector("[data-open-saved-note]").addEventListener("click", (event) => {
    event.stopPropagation();
    selectedVerseData = verseData;
    tooltip.remove();
    showNoteEditor();
    showModal(verseSheet);
  });
  verse.appendChild(tooltip);
}

function clearMultiSelectionVisuals() {
  multiSelectMode = false;
  document.querySelectorAll(".scripture-line.is-multi-selected, .parallel-scripture-line.is-multi-selected").forEach((line) => line.classList.remove("is-multi-selected"));
  if (multiSelectMenuToggle) multiSelectMenuToggle.hidden = true;
}

function centerSelectedVerse() {
  const verse = readerScreen?.querySelector(".scripture-line.is-selected, .parallel-scripture-line.is-selected");
  if (!verse || !verseSheet?.classList.contains("is-visible") || !readerScreen) {
    return;
  }

  const screenRect = readerScreen.getBoundingClientRect();
  const sheetRect = verseSheet.getBoundingClientRect();
  const availableTop = screenRect.top + 18;
  const availableBottom = Math.max(availableTop, sheetRect.top - 18);
  const targetCenter = availableTop + (availableBottom - availableTop) / 2;
  const verseRect = verse.getBoundingClientRect();
  const scrollDelta = verseRect.top + verseRect.height / 2 - targetCenter;

  readerScreen.scrollBy({ top: scrollDelta, behavior: "smooth" });
}

function updateFocusedVerseFromScroll() {
  if (appShell?.dataset.modal !== "verse" || !verseSheet?.classList.contains("is-visible")) {
    return;
  }

  const verses = [...readerScreen.querySelectorAll(".scripture-line, .parallel-scripture-line")];
  if (!verses.length) return;

  const screenRect = readerScreen.getBoundingClientRect();
  const sheetRect = verseSheet.getBoundingClientRect();
  const focusTop = screenRect.top + 18;
  const focusBottom = Math.max(focusTop, sheetRect.top - 18);
  const focusCenter = focusTop + (focusBottom - focusTop) / 2;
  const nextVerse = verses.reduce((closest, verse) => {
    const distance = Math.abs(verse.getBoundingClientRect().top + verse.getBoundingClientRect().height / 2 - focusCenter);
    return !closest || distance < closest.distance ? { verse, distance } : closest;
  }, null)?.verse;

  if (!nextVerse || nextVerse.classList.contains("is-selected")) return;

  document.querySelectorAll(".scripture-line.is-selected, .parallel-scripture-line.is-selected")
    .forEach((line) => line.classList.remove("is-selected"));
  nextVerse.classList.add("is-selected");
  selectedVerseData = getVerseDataFromElement(nextVerse);
  if (selectedVerse) selectedVerse.textContent = selectedVerseData.reference;
  syncVerseActionStates();
}
