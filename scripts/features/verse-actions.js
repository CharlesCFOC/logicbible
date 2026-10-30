// Legacy features/verse-actions: loaded before script.js; declarations only.
// Shared state remains in script.js during the incremental React migration.

function getVerseDataFromElement(verse) {
  return {
    key: verse.dataset.verseKey,
    highlightKey: verse.dataset.highlightKey,
    reference: verse.dataset.verse,
    text: verse.dataset.verseText,
    number: Number(verse.dataset.verseNumber || 0),
    bookId: readerState.bookId,
    chapter: readerState.chapter,
    version: verse.dataset.verseVersion,
  };
}

function showHighlightPicker(selectedFolderId = null) {
  const currentHighlight = savedState.highlights[selectedVerseData.highlightKey];
  const current = currentHighlight?.color || "gold";
  const currentFolderId = selectedFolderId ?? currentHighlight?.folderId ?? "";
  const folderOptions = [
    '<option value="">No folder</option>',
    ...getSavedFolders("highlights").map((folder) => `<option value="${escapeAttr(folder.id)}">${escapeHtml(folder.name)}</option>`),
  ].join("");

  verseDetail.hidden = false;
  verseDetail.innerHTML = `
    <div class="detail-stack">
      <h3>Highlight Color</h3>
      <div class="highlight-palette" role="listbox" aria-label="Highlight color">
        ${highlightColors.map((color) => `
          <button class="${color.id === current ? "is-selected" : ""}" data-highlight-color="${color.id}" style="--swatch: ${color.value}" aria-label="${color.label}">
            <span></span>
          </button>
        `).join("")}
      </div>
      <div class="highlight-folder-tools">
        <label class="highlight-folder-select">
          <span>Folder</span>
          <select data-highlight-folder-select>
            ${folderOptions}
          </select>
        </label>
        <form class="highlight-folder-form" data-highlight-folder-form>
          <input type="text" name="folder" placeholder="New folder" aria-label="New highlight folder" />
          <button aria-label="Create highlight folder"><i data-lucide="plus"></i></button>
        </form>
      </div>
      <button class="secondary-button${currentHighlight ? " is-highlight-active" : ""}" data-remove-highlight${currentHighlight ? "" : " disabled"}>Remove Highlight</button>
    </div>
  `;

  const folderSelect = verseDetail.querySelector("[data-highlight-folder-select]");
  folderSelect.value = currentFolderId;
  verseDetail.querySelectorAll("[data-highlight-color]").forEach((button) => {
    button.addEventListener("click", () => applyHighlight(button.dataset.highlightColor));
  });
  folderSelect.addEventListener("change", () => updateSelectedHighlightFolder(folderSelect.value));
  verseDetail.querySelector("[data-highlight-folder-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = event.currentTarget.elements.folder;
    const folderName = input.value.trim() || window.prompt("Folder name") || "";
    const folderId = createSavedFolder("highlights", folderName, { renderProfile: false });
    input.value = "";
    if (folderId) {
      updateSelectedHighlightFolder(folderId, { silent: true });
      showHighlightPicker(folderId);
      setFeedback(`Folder set to ${getFolderName("highlights", folderId)}.`);
    }
  });
  verseDetail.querySelector("[data-remove-highlight]").addEventListener("click", removeHighlight);
  refreshIcons();
}

function applyHighlight(colorId) {
  const color = highlightColors.find((item) => item.id === colorId) || highlightColors[0];
  const items = multiSelectedVerseData.length ? multiSelectedVerseData : [selectedVerseData];
  items.forEach((item) => {
    const lines = document.querySelectorAll(`[data-highlight-key="${CSS.escape(item.highlightKey)}"]`);
    const existingHighlight = savedState.highlights[item.highlightKey];
    const folderId = verseDetail.querySelector("[data-highlight-folder-select]")?.value || existingHighlight?.folderId || "";
    savedState.highlights[item.highlightKey] = {
      ...item,
      key: item.highlightKey,
      folderId,
      color: color.id,
      colorValue: color.value,
      updatedAt: new Date().toISOString(),
    };
    lines.forEach((line) => {
      line.classList.add("is-highlighted");
      line.style.setProperty("--highlight-color", color.value);
    });
  });
  verseDetail.querySelectorAll("[data-highlight-color]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.highlightColor === color.id);
  });
  writeJson("brother.highlights", savedState.highlights);
  setFeedback(`${color.label} highlight applied to ${items.length} verse${items.length === 1 ? "" : "s"}.`);
  syncVerseActionStates();
  refreshProfilePanel();
  refreshHomeLibraryPanel();
  if (multiSelectedVerseData.length) exitMultiSelectMode();
}

function updateSelectedHighlightFolder(folderId, options = {}) {
  if (!selectedVerseData) {
    return;
  }

  const existingHighlight = savedState.highlights[selectedVerseData.highlightKey];
  if (!existingHighlight) {
    if (!options.silent) {
      setFeedback("Folder selected. Choose a color to save the highlight.");
    }
    return;
  }

  existingHighlight.folderId = folderId || "";
  existingHighlight.updatedAt = new Date().toISOString();
  writeJson("brother.highlights", savedState.highlights);
  refreshProfilePanel();

  if (!options.silent) {
    setFeedback(`Folder set to ${getFolderName("highlights", folderId)}.`);
  }
}

function removeHighlight() {
  if (!selectedVerseData || !savedState.highlights[selectedVerseData.highlightKey]) {
    return;
  }
  const lines = document.querySelectorAll(`[data-highlight-key="${CSS.escape(selectedVerseData.highlightKey)}"]`);
  delete savedState.highlights[selectedVerseData.highlightKey];
  lines.forEach((line) => {
    line.classList.remove("is-highlighted");
    line.style.removeProperty("--highlight-color");
  });
  verseDetail.querySelectorAll("[data-highlight-color]").forEach((button) => {
    button.classList.remove("is-selected");
  });
  writeJson("brother.highlights", savedState.highlights);
  setFeedback("Highlight removed.");
  syncVerseActionStates();
  refreshProfilePanel();

  if (readerState.showHighlightsOnly && currentChapterData) {
    closeModal();
    if (readerState.parallelEnabled) {
      loadChapter();
    } else {
      renderChapter(currentChapterData);
    }
  }
}

function migrateLegacyHighlight(canonicalKey, versionedKey) {
  const canonicalHighlight = savedState.highlights[canonicalKey];
  if (canonicalHighlight && !canonicalHighlight.colorValue) {
    canonicalHighlight.color = "gold";
    canonicalHighlight.colorValue = highlightColors[0].value;
  }

  const legacyHighlight = savedState.highlights[versionedKey];
  if (legacyHighlight && !savedState.highlights[canonicalKey]) {
    savedState.highlights[canonicalKey] = {
      ...legacyHighlight,
      key: canonicalKey,
      color: legacyHighlight.color || "gold",
      colorValue: legacyHighlight.colorValue || highlightColors[0].value,
      migratedAt: new Date().toISOString(),
    };
    delete savedState.highlights[versionedKey];
    writeJson("brother.highlights", savedState.highlights);
  }
}

async function copyVerse() {
  const text = getSelectedVerseShareText();
  try {
    await navigator.clipboard.writeText(text);
    setFeedback("Copied to clipboard.");
  } catch {
    setFeedback("Copy is not available in this browser.");
  }
}

async function shareVerse() {
  const text = getSelectedVerseShareText();
  if (navigator.share && (!navigator.canShare || navigator.canShare({ text }))) {
    try {
      await navigator.share({ title: selectedVerseData.reference, text });
      setFeedback("Share sheet opened.");
      return;
    } catch {
      await copyVerse();
      setFeedback("Share was canceled, so the verse was copied.");
      return;
    }
  }
  await copyVerse();
  setFeedback("Sharing is not available here, so the verse was copied.");
}

function showBookmarkPicker() {
  if (!selectedVerseData) {
    return;
  }

  const items = multiSelectedVerseData.length ? multiSelectedVerseData : [selectedVerseData];
  items.forEach((item) => {
    const line = document.querySelector(`[data-verse-key="${CSS.escape(item.key)}"]`);
    if (!savedState.bookmarks[item.key]) {
      savedState.bookmarks[item.key] = {
        ...item,
        createdAt: new Date().toISOString(),
        folderId: "",
      };
      line?.classList.add("is-bookmarked");
    }
  });
  writeJson("brother.bookmarks", savedState.bookmarks);

  const currentBookmark = savedState.bookmarks[selectedVerseData.key];
  const folderOptions = [
    '<option value="">No folder</option>',
    ...getSavedFolders("bookmarks").map((folder) => `<option value="${escapeAttr(folder.id)}">${escapeHtml(folder.name)}</option>`),
  ].join("");

  verseDetail.hidden = false;
  verseDetail.innerHTML = `
    <div class="detail-stack">
      <h3>Bookmark folder</h3>
      <div class="highlight-folder-tools">
        <label class="highlight-folder-select">
          <span>Folder</span>
          <select data-bookmark-folder-select>${folderOptions}</select>
        </label>
        <form class="highlight-folder-form" data-bookmark-folder-form>
          <input type="text" name="folder" placeholder="New folder" aria-label="New bookmark folder" />
          <button aria-label="Create bookmark folder"><i data-lucide="plus"></i></button>
        </form>
      </div>
      <button class="secondary-button" data-remove-bookmark>Remove Bookmark</button>
    </div>
  `;

  const folderSelect = verseDetail.querySelector("[data-bookmark-folder-select]");
  folderSelect.value = currentBookmark.folderId || "";
  folderSelect.addEventListener("change", () => {
    items.forEach((item) => {
      if (savedState.bookmarks[item.key]) savedState.bookmarks[item.key].folderId = folderSelect.value;
    });
    writeJson("brother.bookmarks", savedState.bookmarks);
    refreshProfilePanel();
    setFeedback(`Bookmark filed in ${getFolderName("bookmarks", folderSelect.value)}.`);
  });

  verseDetail.querySelector("[data-bookmark-folder-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = event.currentTarget.elements.folder;
    const folderName = input.value.trim() || window.prompt("Folder name") || "";
    const folderId = createSavedFolder("bookmarks", folderName, { renderProfile: false });
    input.value = "";
    if (folderId) {
      currentBookmark.folderId = folderId;
      writeJson("brother.bookmarks", savedState.bookmarks);
      showBookmarkPicker();
      setFeedback(`Bookmark filed in ${getFolderName("bookmarks", folderId)}.`);
    }
  });

  verseDetail.querySelector("[data-remove-bookmark]").addEventListener("click", removeBookmark);
  syncVerseActionStates();
  refreshProfilePanel();
  refreshIcons();
}

function removeBookmark() {
  if (!selectedVerseData) {
    return;
  }

  const items = multiSelectMode && multiSelectedVerseData.length ? multiSelectedVerseData : [selectedVerseData];
  items.forEach((item) => {
    const line = document.querySelector(`[data-verse-key="${CSS.escape(item.key)}"]`);
    delete savedState.bookmarks[item.key];
    line?.classList.remove("is-bookmarked");
  });
  writeJson("brother.bookmarks", savedState.bookmarks);
  syncVerseActionStates();
  refreshProfilePanel();
  hideVerseDetail();
  setFeedback(`Bookmark${items.length === 1 ? "" : "s"} removed.`);
  if (multiSelectedVerseData.length) exitMultiSelectMode();
}

async function showOriginalLanguagePanel() {
  const language = getOriginalLanguage(selectedVerseData.bookId);
  verseSheet?.classList.add("is-original-language");
  appShell.dataset.modal = "original-language";
  verseDetail.hidden = false;
  verseDetail.innerHTML = `
    <div class="detail-stack">
      <button type="button" class="original-language-close" data-original-language-close aria-label="Close original language panel"><i data-lucide="x"></i></button>
      <h3>${language.title}</h3>
      <p>Loading original-language data...</p>
    </div>
  `;
  verseDetail.querySelector("[data-original-language-close]")?.addEventListener("click", closeModal);
  refreshIcons();

  try {
    const params = new URLSearchParams({
      bookId: selectedVerseData.bookId,
      chapter: String(selectedVerseData.chapter),
      verse: String(selectedVerseData.number),
    });
    const response = await fetch(apiUrl(`/api/original-language?${params.toString()}`));
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Original-language data is not available for this verse.");
    }

    const isHebrew = payload.language === "hebrew";
    const translationWords = String(selectedVerseData.text || "").split(/(\s+)/);
    let translationWordIndex = 0;
    let translationTokenOrdinal = 0;
    const translationTokens = translationWords
      .map((part, index) => ({
        index,
        wordIndex: /^\s+$/.test(part) ? null : translationTokenOrdinal++,
        value: part,
        normalized: part.toLowerCase().replace(/[^a-z0-9]/g, ""),
      }))
      .filter((part) => part.normalized && part.wordIndex !== null);
    const translationMarkup = translationWords.map((part) => {
      if (/^\s+$/.test(part)) return part;
      const markup = `<span data-interlinear-verse-word="${translationWordIndex}">${escapeHtml(part)}</span>`;
      translationWordIndex += 1;
      return markup;
    }).join("");
    const wordAliases = {
      one: ["first"],
      two: ["second"],
      three: ["third"],
      four: ["fourth"],
      yahweh: ["lord"],
      lord: ["yahweh"],
      "to be": ["came", "was", "is"],
      repen: ["returned", "repent", "return"],
      repent: ["returned", "repent", "return"],
      say: ["said", "says"],
      says: ["said", "says"],
    };
    const usedTranslationIndexes = new Set();
    let translationCursor = 0;
    const matchesToken = (token, candidate) => {
      const aliases = [candidate, ...(wordAliases[candidate] || [])];
      return aliases.some((value) => {
        const normalized = String(value).replace(/[^a-z0-9]/g, "");
        return token.normalized === normalized
          || token.normalized === `${normalized}s`
          || normalized === `${token.normalized}s`;
      });
    };
    const findTranslationWordIndexes = (word) => {
      const phraseTerms = String(word.english || "")
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean);
      const fallbackTerms = [word.gloss, word.lexicalGloss]
        .filter(Boolean)
        .flatMap((value) => String(value).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
      const terms = phraseTerms.length ? phraseTerms : fallbackTerms;
      const matched = [];
      let searchFrom = translationCursor;

      terms.forEach((term) => {
        const match = translationTokens.find((token) => token.wordIndex >= searchFrom && !usedTranslationIndexes.has(token.wordIndex) && matchesToken(token, term));
        if (match) {
          matched.push(match.wordIndex);
          usedTranslationIndexes.add(match.wordIndex);
          searchFrom = match.wordIndex + 1;
        }
      });

      if (!matched.length && fallbackTerms.length && terms !== fallbackTerms) {
        const fallbackMatch = translationTokens.find((token) => token.wordIndex >= translationCursor && !usedTranslationIndexes.has(token.wordIndex) && fallbackTerms.some((term) => matchesToken(token, term)));
        if (fallbackMatch) {
          matched.push(fallbackMatch.wordIndex);
          usedTranslationIndexes.add(fallbackMatch.wordIndex);
        }
      }

      if (!matched.length) return null;
      const start = Math.min(...matched);
      const end = Math.max(...matched);
      const group = Array.from({ length: end - start + 1 }, (_, offset) => start + offset);
      group.forEach((index) => usedTranslationIndexes.add(index));
      translationCursor = end + 1;
      return group;
    };
    const wordTranslationIndexes = payload.words.map(findTranslationWordIndexes);
    const orderedWords = payload.words
      .map((word, index) => ({ word, translationIndexes: wordTranslationIndexes[index], sourceIndex: index }))
      .sort((a, b) => (a.translationIndexes?.[0] ?? Number.MAX_SAFE_INTEGER) - (b.translationIndexes?.[0] ?? Number.MAX_SAFE_INTEGER) || a.sourceIndex - b.sourceIndex);
    verseDetail.innerHTML = `
      <div class="detail-stack interlinear-panel">
        <div class="interlinear-heading">
          <div>
            <span>Word study</span>
            <h3>${isHebrew ? "Hebrew" : "Greek"} interlinear</h3>
          </div>
          <button type="button" class="original-language-close" data-original-language-close aria-label="Close original language panel"><i data-lucide="x"></i></button>
        </div>
        <div class="interlinear-verse-card">
          <p data-interlinear-verse dir="ltr">${translationMarkup}</p>
        </div>
        <div class="interlinear-list" aria-label="Word by word study">
          ${orderedWords.map(({ word, translationIndexes }, index) => `
            <article class="interlinear-row"${translationIndexes?.length ? ` data-interlinear-words="${translationIndexes.join(",")}"` : ""} tabindex="0" role="button" aria-label="Highlight word ${index + 1}">
              <div class="interlinear-translation">
                <strong>${escapeHtml(word.english || word.translation || "—")}</strong>
              </div>
              <div class="interlinear-original" dir="${isHebrew ? "rtl" : "ltr"}">
                <strong>${escapeHtml(word.original || "—")}</strong>
                <span>${escapeHtml(word.transliteration || word.lemma || "")}</span>
              </div>
              <p class="interlinear-meaning">${escapeHtml(word.gloss || word.lexicalGloss || word.english || "Meaning unavailable")}</p>
            </article>
          `).join("")}
        </div>
        <div class="source-credit">STEP Bible · Tyndale House · ${escapeHtml(payload.source?.license || "CC BY 4.0")}</div>
      </div>
    `;
    verseDetail.querySelector("[data-original-language-close]")?.addEventListener("click", closeModal);
    verseDetail.querySelectorAll("[data-interlinear-words]").forEach((card) => {
      const activateWord = () => {
        const indexes = card.dataset.interlinearWords.split(",").filter(Boolean);
        const wasActive = card.classList.contains("is-active");
        verseDetail.querySelectorAll("[data-interlinear-words]").forEach((item) => item.classList.remove("is-active"));
        verseDetail.querySelectorAll("[data-interlinear-verse-word]").forEach((item) => item.classList.remove("is-active"));
        if (!wasActive) {
          card.classList.add("is-active");
          indexes.forEach((index) => {
            verseDetail.querySelector(`[data-interlinear-verse-word="${index}"]`)?.classList.add("is-active");
          });
        }
      };
      card.addEventListener("click", activateWord);
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activateWord();
        }
      });
    });
    refreshIcons();
  } catch (error) {
    const insights = greekInsights[selectedVerseData.bookId]?.[selectedVerseData.chapter]?.[selectedVerseData.number] || [];
    verseDetail.innerHTML = `
      <div class="detail-stack">
        <button type="button" class="original-language-close" data-original-language-close aria-label="Close original language panel"><i data-lucide="x"></i></button>
        <h3>${language.title}</h3>
        ${
          insights.length
            ? insights.map((item) => `
                <article>
                  <strong>${escapeHtml(item.term)}</strong>
                  <span>${escapeHtml(item.gloss)}</span>
                  <p>${escapeHtml(item.note)}</p>
                </article>
              `).join("")
            : `<p>${escapeHtml(error.message)} You can still copy, note, highlight, compare translations, or ask Brother AI for a word study.</p>`
        }
      </div>
    `;
    verseDetail.querySelector("[data-original-language-close]")?.addEventListener("click", closeModal);
    refreshIcons();
  }
}

function showComparePanel() {
  const book = getBook(selectedVerseData.bookId);
  const localRows = LOCAL_VERSIONS.map((version) => {
    const chapter = LOCAL_BIBLE[version.id]?.[`${selectedVerseData.bookId}.${selectedVerseData.chapter}`];
    const text = chapter?.verses?.[selectedVerseData.number - 1];
    return text ? { label: version.abbreviation, name: compareVersions[version.abbreviation] || version.name, text } : null;
  }).filter(Boolean);

  verseDetail.hidden = false;
  verseDetail.innerHTML = `
    <div class="detail-stack">
      <h3>Compare Translations</h3>
      ${
        localRows.length
          ? localRows.map((row) => `
              <article>
                <strong>${escapeHtml(row.label)}</strong>
                <span>${escapeHtml(row.name)}</span>
                <p>${escapeHtml(row.text)}</p>
              </article>
            `).join("")
          : `<p>Comparison is ready for ${book.name} ${selectedVerseData.chapter}:${selectedVerseData.number}. Add local text or connect a parallel passage endpoint for multiple API.Bible versions.</p>`
      }
    </div>
  `;
}

function showHighlightedVersesOnly() {
  readerState.showHighlightsOnly = true;
  closeModal();

  if (currentChapterData) {
    if (readerState.parallelEnabled) {
      loadChapter();
    } else {
      renderChapter(currentChapterData);
    }
  } else {
    loadChapter();
  }
}

async function showParallelFromVerse() {
  const verseKey = selectedVerseData?.highlightKey;
  readerState.parallelEnabled = true;
  readerState.showHighlightsOnly = false;
  renderParallelOptions();
  closeModal();
  await loadChapter();

  window.setTimeout(() => {
    if (!verseKey) {
      return;
    }
    const card = document.querySelector(`.parallel-scripture-line[data-highlight-key="${CSS.escape(verseKey)}"]`);
    if (!card) {
      return;
    }
    document.querySelectorAll(".parallel-scripture-line.is-selected, .scripture-line.is-selected").forEach((item) => item.classList.remove("is-selected"));
    card.classList.add("is-selected");
    card.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 80);
}

async function handleVerseAction(action) {
  if (!selectedVerseData) {
    return;
  }

  try {
    const isMultiAction = multiSelectedVerseData.length > 0;
    if (action === "highlight") {
      showHighlightPicker();
      if (isMultiAction) clearMultiSelectionVisuals();
    }
    if (action === "copy") {
      await copyVerse();
      if (isMultiAction) exitMultiSelectMode();
    }
    if (action === "share") {
      await shareVerse();
      if (isMultiAction) exitMultiSelectMode();
    }
    if (action === "bookmark") {
      showBookmarkPicker();
      if (isMultiAction) clearMultiSelectionVisuals();
    }
    if (action === "note") {
      openRichNoteEditor();
    }
    if (action === "ask-ai") askAiAboutVerse();
    if (action === "original-language") await showOriginalLanguagePanel();
    if (action === "compare") showComparePanel();
    if (action === "parallel") await showParallelFromVerse();
    if (action === "target") showHighlightedVersesOnly();
    if (isMultiAction && !["highlight", "bookmark", "note", "copy", "share"].includes(action)) {
      clearMultiSelectionVisuals();
    }
  } catch (error) {
    setFeedback(error.message || "Action failed.");
  }
}
