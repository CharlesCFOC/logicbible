// Legacy features/reader: loaded before script.js; declarations only.
// Shared state remains in script.js during the incremental React migration.

function getBook(bookId) {
  return BOOKS.find((book) => book.id === bookId) || BOOKS.find((book) => book.id === "JHN");
}

function getVersion(versionId) {
  return readerState.versions.find((version) => version.id === versionId) || readerState.versions[0];
}

function getVersionDedupeKey(version) {
  const abbreviation = String(version.abbreviation || version.id || "").toLowerCase().replace(/\s+/g, "").trim();
  const language = version.language || (version.source === "local" ? "eng" : version.source || "");
  return `${language}:${abbreviation}`;
}

function dedupeVersions(versions) {
  const seen = new Set();
  const excludedVersions = new Set(["t4t", "bsb", "englishkjv", "engkjv", "jnd", "lsv"]);
  return versions.filter((version) => {
    const normalize = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if ([version.abbreviation, version.name, version.id].some((value) => excludedVersions.has(normalize(value)))) {
      return false;
    }
    const key = getVersionDedupeKey(version);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function getPopularVersionKey(version) {
  if (version.id === "local-kjv") return "KJV";
  return String(version.abbreviation || "").toUpperCase().replace(/\s+/g, "");
}

function getVersionLanguageFlag(version) {
  const language = version.language || (version.source === "local" ? "eng" : "");
  if (language === "fra") return "🇫🇷";
  if (language === "eng") return "🇺🇸";
  return "🌐";
}

function getVersionMenuLabel(version) {
  return `${getVersionLanguageFlag(version)} ${version.abbreviation}`;
}

function sortVersionsForMenu(versions) {
  const popular = popularVersionOrder
    .map((key) => versions.find((version) => getPopularVersionKey(version) === key))
    .filter(Boolean)
    .slice(0, 5);
  const popularIds = new Set(popular.map((version) => version.id));
  const rest = versions.filter((version) => !popularIds.has(version.id));
  return { popular, rest };
}

function getOriginalLanguage(bookId = readerState.bookId) {
  const bookIndex = BOOKS.findIndex((book) => book.id === bookId);
  return bookIndex >= newTestamentStartIndex
    ? { id: "greek", label: "Greek", title: "Original Greek", dataset: "Strong's Greek / NA alignment" }
    : { id: "hebrew", label: "Hebrew", title: "Original Hebrew", dataset: "Strong's Hebrew / BHS alignment" };
}

function getRemoteFallbackVersion(localVersionId) {
  const remoteVersions = remoteBibleVersions;

  if (localVersionId === "local-kjv") {
    return (
      remoteVersions.find((version) => /^engKJV$/i.test(version.abbreviation)) ||
      remoteVersions.find((version) => /King James Version/i.test(version.name) && !/New King James/i.test(version.name)) ||
      remoteVersions.find((version) => /KJV/i.test(`${version.abbreviation} ${version.name}`) && !/NKJV|New King James/i.test(`${version.abbreviation} ${version.name}`))
    );
  }


  return null;
}

function normalizeApiChapter(data, version) {
  const content = data.content || "";
  const parsedVerses = [];

  if (window.DOMParser && content) {
    const doc = new DOMParser().parseFromString(`<div>${content}</div>`, "text/html");
    let currentVerse = null;

    function startVerse(number) {
      if (currentVerse?.text.trim()) {
        parsedVerses.push({ number: currentVerse.number, text: currentVerse.text.replace(/\s+/g, " ").trim() });
      }
      currentVerse = { number, text: "" };
    }

    function walk(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        if (currentVerse) {
          currentVerse.text += ` ${node.textContent}`;
        }
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }

      const number = node.dataset?.number || (node.classList?.contains("v") ? node.textContent.trim() : "");
      if (/^\d+$/.test(number)) {
        startVerse(Number(number));
        return;
      }

      node.childNodes.forEach(walk);

      if (node.matches?.("p, div, section")) {
        if (currentVerse) {
          currentVerse.text += " ";
        }
      }
    }

    doc.body.childNodes.forEach(walk);
    if (currentVerse?.text.trim()) {
      parsedVerses.push({ number: currentVerse.number, text: currentVerse.text.replace(/\s+/g, " ").trim() });
    }
  }

  const text = content
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const verses = parsedVerses.length ? parsedVerses : text ? [{ number: "", text }] : [];

  return {
    source: "api",
    title: data.reference || `${getBook(readerState.bookId).name} ${readerState.chapter}`,
    version: version.abbreviation,
    copyright: data.copyright || "",
    verses,
  };
}

async function fetchChapter() {
  return fetchChapterForVersion(getVersion(readerState.versionId));
}

async function fetchChapterForVersion(version) {
  const chapterKey = `${readerState.bookId}.${readerState.chapter}`;

  if (version.source === "local") {
    const chapter = LOCAL_BIBLE[version.id]?.[chapterKey];
    if (!chapter) {
      const fallbackVersion = getRemoteFallbackVersion(version.id);
      if (fallbackVersion) {
        return fetchRemoteChapter(fallbackVersion, {
          displayVersion: version.abbreviation,
          displayName: version.name,
          fallbackName: fallbackVersion.name,
        });
      }

      return {
        source: "local",
        title: "Chapter not in local cache",
        version: version.abbreviation,
        copyright: "This chapter is not cached offline yet. API.Bible is still loading, or no matching remote version is available.",
        verses: [],
      };
    }

    return {
      source: "local",
      title: chapter.title,
      version: version.abbreviation,
      copyright: chapter.copyright,
      verses: chapter.verses.map((text, index) => ({ number: index + 1, text })),
    };
  }

  return fetchRemoteChapter(version);
}

async function fetchRemoteChapter(version, options = {}) {
  const cacheKey = `${version.id}.${readerState.bookId}.${readerState.chapter}`;
  const cachedChapter = bibleChapterCache.get(cacheKey);
  if (cachedChapter) {
    const cached = {
      ...cachedChapter,
      verses: cachedChapter.verses.map((verse) => ({ ...verse })),
    };
    if (options.displayVersion) {
      cached.version = options.displayVersion;
      cached.versionName = options.displayName;
      cached.remoteName = options.fallbackName;
    }
    return cached;
  }

  const params = new URLSearchParams({
    bibleId: version.id,
    bookId: readerState.bookId,
    chapter: String(readerState.chapter),
  });
  const response = await fetch(apiUrl(`/api/bible/chapter?${params.toString()}`));
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Unable to load this chapter.");
  }

  const chapter = normalizeApiChapter(payload.data, version);
  bibleChapterCache.set(cacheKey, {
    ...chapter,
    verses: chapter.verses.map((verse) => ({ ...verse })),
  });
  if (options.displayVersion) {
    chapter.version = options.displayVersion;
    chapter.versionName = options.displayName;
    chapter.remoteName = options.fallbackName;
  }
  return chapter;
}

function renderLoading() {
  readerSource.textContent = "Loading Scripture";
  readerChapter.textContent = readerState.chapter;
  if (window.reactBibleChapterMounted) {
    emitBibleChapterChange();
    return;
  }
  versesList.innerHTML = '<p class="reader-empty">Loading chapter...</p>';
  copyrightNote.textContent = "";
}

function renderChapter(chapter, parallelChapters = []) {
  const book = getBook(readerState.bookId);
  const version = getVersion(readerState.versionId);
  const versionName = chapter.versionName || version.name;

  readerSource.textContent = `${book.name} ${readerState.chapter} · ${readerState.parallelEnabled ? "Parallel" : `${getVersionLanguageFlag(version)} ${versionName}`}`;
  readerChapter.textContent = readerState.chapter;
  copyrightNote.textContent = chapter.copyright || "";

  if (window.reactBibleChapterMounted) {
    emitBibleChapterChange();
    return;
  }

  if (!chapter.verses.length) {
    versesList.innerHTML = `
      <div class="reader-empty">
        <strong>${chapter.title}</strong>
        <span>${chapter.copyright}</span>
      </div>
    `;
    return;
  }

  const visibleVerses = readerState.showHighlightsOnly
    ? chapter.verses.filter((verse) => savedState.highlights[getCanonicalVerseKey(book.id, readerState.chapter, verse.number || 0)])
    : chapter.verses;
  // The active Cible button already indicates that the highlight filter is on.
  // Keep the reading area clear instead of adding a second filter banner.
  const filterNotice = "";

  if (!visibleVerses.length) {
    versesList.innerHTML = `
      ${filterNotice}
      <p class="reader-empty reader-empty-highlight">No highlighted verses.</p>
    `;
    bindReaderFilterActions();
    return;
  }

  if (readerState.parallelEnabled) {
    versesList.innerHTML = filterNotice + renderParallelVerses(visibleVerses, chapter, parallelChapters, book, version);
    bindVerseActions();
    bindReaderFilterActions();
    return;
  }

  versesList.innerHTML = filterNotice + visibleVerses
    .map((verse) => {
      const reference = `${book.name} ${readerState.chapter}${verse.number ? `:${verse.number}` : ""}`;
      const highlightKey = getCanonicalVerseKey(book.id, readerState.chapter, verse.number || 0);
      const versionedKey = getVersionedVerseKey(book.id, readerState.chapter, verse.number || 0, version.abbreviation);
      migrateLegacyHighlight(highlightKey, versionedKey);
      const highlight = savedState.highlights[highlightKey];
      const note = savedState.notes[versionedKey];
      const highlighted = highlight ? " is-highlighted" : "";
      const bookmarked = savedState.bookmarks[versionedKey] ? " is-bookmarked" : "";
      const colorStyle = highlight?.colorValue ? ` style="--highlight-color: ${highlight.colorValue}"` : "";
      const noted = note ? " is-noted" : "";
      return `
        <p class="scripture-line${highlighted}${bookmarked}${noted}"${colorStyle} data-verse="${reference}" data-highlight-key="${highlightKey}" data-verse-key="${versionedKey}" data-verse-number="${verse.number || ""}" data-verse-version="${escapeAttr(chapter.version || version.abbreviation)}" data-verse-text="${escapeAttr(verse.text)}">
          ${verse.number ? `<sup>${verse.number}</sup>` : ""}${verse.text}
        </p>
      `;
    })
    .join("");

  bindVerseActions();
  bindReaderFilterActions();
}

function getVerseTextFromChapter(chapter, verseNumber) {
  return chapter?.verses?.find((verse) => Number(verse.number) === Number(verseNumber))?.text || "";
}

function renderParallelVerses(visibleVerses, chapter, parallelChapters, book, version) {
  const activeVersion = chapter.version || version.abbreviation;
  const activeVersionName = chapter.versionName || version.name || activeVersion;
  const comparisonChapter = parallelChapters[0];
  const comparisonVersion = comparisonChapter?.version || getVersion(readerState.parallelVersionIds[0])?.abbreviation || "Compare";
  const comparisonVersionName = comparisonChapter?.versionName || getVersion(readerState.parallelVersionIds[0])?.name || comparisonVersion;

  return `
    <div class="parallel-scripture-grid">
      <div class="parallel-version-headers" aria-label="Bible versions">
        <div class="parallel-version-header is-primary">
          <span>Current version</span>
          <strong>${escapeHtml(`${getVersionLanguageFlag(version)} ${activeVersion}`)}</strong>
          <small>${escapeHtml(activeVersionName)}</small>
        </div>
        <div class="parallel-version-header is-compare">
          <span>Compared version</span>
          <strong>${escapeHtml(`${getVersionLanguageFlag(getVersion(readerState.parallelVersionIds[0]) || version)} ${comparisonVersion}`)}</strong>
          <small>${escapeHtml(comparisonVersionName)}</small>
        </div>
      </div>
      ${visibleVerses
    .map((verse) => {
      const reference = `${book.name} ${readerState.chapter}${verse.number ? `:${verse.number}` : ""}`;
      const highlightKey = getCanonicalVerseKey(book.id, readerState.chapter, verse.number || 0);
      const versionedKey = getVersionedVerseKey(book.id, readerState.chapter, verse.number || 0, version.abbreviation);
      migrateLegacyHighlight(highlightKey, versionedKey);
      const highlight = savedState.highlights[highlightKey];
      const note = savedState.notes[versionedKey];
      const highlighted = highlight ? " is-highlighted" : "";
      const bookmarked = savedState.bookmarks[versionedKey] ? " is-bookmarked" : "";
      const noted = note ? " is-noted" : "";
      const colorStyle = highlight?.colorValue ? ` style="--highlight-color: ${highlight.colorValue}"` : "";
      const comparisonText = comparisonChapter
        ? getVerseTextFromChapter(comparisonChapter, verse.number) || "Verse not available in this version."
        : "Choose a version to compare.";
      const verseNumber = verse.number ? `<sup>${verse.number}</sup>` : "";

      return `
        <article class="parallel-scripture-line${highlighted}${bookmarked}${noted}"${colorStyle} data-verse="${reference}" data-highlight-key="${highlightKey}" data-verse-key="${versionedKey}" data-verse-number="${verse.number || ""}" data-verse-version="${escapeAttr(chapter.version || version.abbreviation)}" data-verse-text="${escapeAttr(verse.text)}">
          <p class="parallel-scripture-column" data-parallel-role="active" aria-label="${escapeAttr(chapter.version || version.abbreviation)}">
            ${verseNumber}${escapeHtml(verse.text)}
          </p>
          <p class="parallel-scripture-column" data-parallel-role="compare" aria-label="${escapeAttr(comparisonVersion)}">
            ${verseNumber}${escapeHtml(comparisonText)}
          </p>
        </article>
      `;
    })
    .join("")}
    </div>
  `;
}

function getCanonicalVerseKey(bookId, chapter, verse) {
  return `${bookId}.${chapter}.${verse}`;
}

function getVersionedVerseKey(bookId, chapter, verse, version) {
  return `${version}.${bookId}.${chapter}.${verse}`;
}

function setFeedback(message) {
  sheetFeedback.textContent = message;
  emitBibleVerseUiChange();
  window.setTimeout(() => {
    if (sheetFeedback.textContent === message) {
      sheetFeedback.textContent = "";
      emitBibleVerseUiChange();
    }
  }, 2600);
}

function bindReaderFilterActions() {
  const clearButton = versesList.querySelector("[data-clear-highlight-filter]");
  if (!clearButton) {
    return;
  }

  clearButton.addEventListener("click", () => {
    readerState.showHighlightsOnly = false;
    if (readerState.parallelEnabled) {
      loadChapter();
    } else if (currentChapterData) {
      renderChapter(currentChapterData);
    }
  });
}

function hideVerseDetail() {
  verseDetail.hidden = true;
  verseDetail.innerHTML = "";
}

function getSelectedVerseShareText() {
  if (!selectedVerseData) {
    return "";
  }
  if (multiSelectedVerseData.length > 1) {
    return multiSelectedVerseData
      .map((item) => `${item.reference} ${item.version}\n${item.text}`)
      .join("\n\n");
  }
  return `${selectedVerseData.reference} ${selectedVerseData.version}\n${selectedVerseData.text}`;
}

function emitBibleVerseUiChange() {
  document.dispatchEvent(new CustomEvent("bible:verse-ui-change"));
}

function setVerseActionActive(action, active) {
  const button = verseSheet.querySelector(`[data-verse-action="${CSS.escape(action)}"]`);
  button?.classList.toggle("is-active", active);
}

function syncVerseActionStates() {
  if (!selectedVerseData) {
    emitBibleVerseUiChange();
    return;
  }

  setVerseActionActive("highlight", Boolean(savedState.highlights[selectedVerseData.highlightKey]));
  setVerseActionActive("bookmark", Boolean(savedState.bookmarks[selectedVerseData.key]));
  setVerseActionActive("parallel", readerState.parallelEnabled);
  emitBibleVerseUiChange();
}

async function loadChapter() {
  if (multiSelectMode) {
    exitMultiSelectMode();
  }
  const requestId = ++chapterRequestId;
  bibleChapterLoading = true;
  bibleChapterError = "";
  renderLoading();
  setLocalValue("brother.version", readerState.versionId);
  setLocalValue("brother.book", readerState.bookId);
  setLocalValue("brother.chapter", String(readerState.chapter));
  updateHomeContinueReading();
  setLocalValue("brother.parallel", String(readerState.parallelEnabled));
  writeJson("brother.parallelVersions", readerState.parallelVersionIds);

  try {
    const chapter = await fetchChapter();
    if (requestId !== chapterRequestId) {
      return;
    }
    currentChapterData = chapter;
    const parallelChapters = readerState.parallelEnabled ? await fetchParallelChapters() : [];
    if (requestId !== chapterRequestId) {
      return;
    }
    currentParallelChapterData = parallelChapters;
    renderChapter(chapter, parallelChapters);
    bibleChapterLoading = false;
    emitBibleChapterChange();
    return chapter;
  } catch (error) {
    if (requestId !== chapterRequestId) {
      return;
    }
    bibleChapterLoading = false;
    bibleChapterError = error.message || "Unable to load this chapter.";
    currentParallelChapterData = [];
    if (window.reactBibleChapterMounted) {
      emitBibleChapterChange();
      return;
    }
    versesList.innerHTML = `
      <div class="reader-empty">
        <strong>Could not load this version.</strong>
        <span>${error.message}</span>
      </div>
    `;
  }
}

async function fetchParallelChapters() {
  const id = readerState.parallelVersionIds[0];
  if (!id || id === readerState.versionId) {
    return [];
  }

  const version = readerState.versions.find((item) => item.id === id);
  if (!version) {
    return [];
  }

  try {
    return [await fetchChapterForVersion(version)];
  } catch {
    return [{
      source: "error",
      version: version.abbreviation,
      versionName: version.name,
      copyright: "This version could not be loaded for parallel view.",
      verses: [],
    }];
  }
}

function renderVersionOptions() {
  readerState.versions = dedupeVersions(readerState.versions);
  const { popular, rest } = sortVersionsForMenu(readerState.versions);
  const separator = popular.length && rest.length
    ? '<option value="" disabled>────────────</option>'
    : "";
  versionSelect.innerHTML = [
    ...popular.map((version) => `<option value="${escapeAttr(version.id)}">${escapeHtml(getVersionMenuLabel(version))}</option>`),
    separator,
    ...rest.map((version) => `<option value="${escapeAttr(version.id)}">${escapeHtml(getVersionMenuLabel(version))}</option>`),
  ].join("");

  if (!readerState.versions.some((version) => version.id === readerState.versionId)) {
    readerState.versionId = "local-kjv";
  }
  versionSelect.value = readerState.versionId;
  renderParallelOptions();
  emitBibleReaderChange();
}

function getDefaultParallelVersionIds() {
  return popularVersionOrder
    .map((key) => readerState.versions.find((version) => getPopularVersionKey(version) === key))
    .filter((version) => version && version.id !== readerState.versionId)
    .map((version) => version.id)
    .slice(0, 1);
}

function renderParallelOptions() {
  if (!parallelVersionOne || !parallelToggle || !parallelSelects) {
    return;
  }

  const defaults = getDefaultParallelVersionIds();
  const selectedId = readerState.parallelVersionIds[0];
  readerState.parallelVersionIds = [
    selectedId &&
    selectedId !== readerState.versionId &&
    readerState.versions.some((version) => version.id === selectedId)
      ? selectedId
      : defaults[0] || "",
  ];

  const options = [
    '<option value="">Compare with</option>',
    ...readerState.versions
      .filter((version) => version.id !== readerState.versionId)
      .map((version) => `<option value="${escapeAttr(version.id)}">${escapeHtml(getVersionMenuLabel(version))}</option>`),
  ].join("");
  parallelVersionOne.innerHTML = options;
  parallelVersionOne.value = readerState.parallelVersionIds[0];
  parallelToggle.classList.toggle("is-active", readerState.parallelEnabled);
  readerTargetToggle?.classList.toggle("is-active", readerState.showHighlightsOnly);
  parallelSelects.hidden = !readerState.parallelEnabled;
  emitBibleReaderChange();
}

function renderBookOptions() {
  bookSelect.innerHTML = BOOKS.map((book) => `<option value="${book.id}">${book.name}</option>`).join("");
  bookSelect.value = readerState.bookId;
  emitBibleReaderChange();
}

function renderChapterOptions() {
  const book = getBook(readerState.bookId);
  if (readerState.chapter > book.chapters) {
    readerState.chapter = book.chapters;
  }

  chapterSelect.innerHTML = Array.from(
    { length: book.chapters },
    (_, index) => `<option value="${index + 1}">${index + 1}</option>`,
  ).join("");
  chapterSelect.value = String(readerState.chapter);
  emitBibleReaderChange();
}

function emitBibleReaderChange() {
  document.dispatchEvent(new CustomEvent("bible:reader-change"));
}

function emitBibleChapterChange() {
  document.dispatchEvent(new CustomEvent("bible:chapter-change"));
}

async function loadRemoteVersions() {
  try {
    const response = await fetch(apiUrl("/api/bible/versions"));
    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    const remoteVersions = payload.data || [];
    if (!remoteVersions.length) {
      return;
    }

    remoteBibleVersions = remoteVersions;

    readerState.versions = dedupeVersions([
      ...LOCAL_VERSIONS,
      ...remoteVersions.filter((version) => !/\bWEB\b|World English Bible/i.test(`${version.abbreviation || ""} ${version.name || ""}`)),
    ]);
    renderVersionOptions();
    loadChapter();
  } catch {
    // Local Bible data remains available when the API server is not configured.
  }
}

function bindVerseActions() {
  document.querySelectorAll(".scripture-line, .parallel-scripture-line").forEach((verse) => {
    let touchStartX = 0;
    let touchStartY = 0;
    let suppressClickUntil = 0;
    let longPressActivated = false;
    let noteSwipeOpened = false;

    const cancelLongPress = () => {
      if (multiLongPressTimer) {
        window.clearTimeout(multiLongPressTimer);
        multiLongPressTimer = null;
      }
    };

    verse.addEventListener("pointerdown", (event) => {
      cancelLongPress();
      touchStartX = event.clientX;
      touchStartY = event.clientY;
      longPressActivated = false;
      noteSwipeOpened = false;
      multiLongPressTimer = window.setTimeout(() => {
        startMultiSelect(verse);
        longPressActivated = true;
        suppressClickUntil = Date.now() + 800;
        suppressVerseClickUntil = Date.now() + 800;
        multiLongPressTimer = null;
      }, 550);
    });

    verse.addEventListener("pointerup", () => {
      cancelLongPress();
      longPressActivated = false;
    });
    verse.addEventListener("pointercancel", () => {
      cancelLongPress();
      longPressActivated = false;
    });
    verse.addEventListener("pointermove", (event) => {
      if (!longPressActivated || noteSwipeOpened) {
        if (!longPressActivated) cancelLongPress();
        return;
      }

      const deltaX = event.clientX - touchStartX;
      const deltaY = event.clientY - touchStartY;
      const isLeftSwipe = deltaX < -64 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2;
      if (!isLeftSwipe) {
        return;
      }

      noteSwipeOpened = true;
      suppressClickUntil = Date.now() + 900;
      selectedVerseData = getVerseDataFromElement(verse);
      openRichNoteEditor();
    });

    verse.addEventListener("click", () => {
      if (Date.now() < suppressClickUntil || Date.now() < suppressVerseClickUntil) {
        return;
      }

      if (multiSelectMode) {
        if (noteEditorAddingVerses) {
          const data = getVerseDataFromElement(verse);
          const alreadyAttached = multiSelectedVerseData.some((item) => item.key === data.key);
          if (!alreadyAttached) {
            multiSelectedVerseData.push(data);
            selectedVerseData = data;
            updateMultiSelectionUi();
            markNoteEditorDirty();
            setFeedback(`${data.reference} added. Open the note menu to continue.`);
          }
          return;
        }
        toggleMultiSelectedVerse(verse);
        return;
      }

      multiSelectedVerseData = [];
      closeNoteTooltips();
      selectedVerseData = getVerseDataFromElement(verse);
      document.querySelectorAll(".scripture-line.is-selected, .parallel-scripture-line.is-selected").forEach((line) => line.classList.remove("is-selected"));
      verse.classList.add("is-selected");
      selectedVerse.textContent = selectedVerseData.reference;
      hideVerseDetail();
      sheetFeedback.textContent = "";
      syncVerseActionStates();
      showModal(verseSheet);
    });

    verse.addEventListener("touchstart", (event) => {
      const touch = event.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    }, { passive: true });

  });
}

function getBibleVerseSnapshot(verse, chapter = currentChapterData, version = getVersion(readerState.versionId)) {
  const book = getBook(readerState.bookId);
  const number = Number(verse.number || 0);
  const highlightKey = getCanonicalVerseKey(book.id, readerState.chapter, number);
  const key = getVersionedVerseKey(book.id, readerState.chapter, number, version.abbreviation);
  const highlight = savedState.highlights[highlightKey];
  return {
    number,
    text: verse.text || "",
    reference: `${book.name} ${readerState.chapter}${number ? `:${number}` : ""}`,
    bookId: book.id,
    chapter: readerState.chapter,
    highlightKey,
    key,
    version: chapter?.version || version.abbreviation,
    highlighted: Boolean(highlight),
    highlightColor: highlight?.colorValue || "",
    bookmarked: Boolean(savedState.bookmarks[key]),
    noted: Boolean(savedState.notes[key]),
  };
}

function getBibleChapterSnapshot() {
  const book = getBook(readerState.bookId);
  const version = getVersion(readerState.versionId);
  const chapter = currentChapterData;
  const visibleVerses = chapter?.verses?.filter((verse) => !readerState.showHighlightsOnly || savedState.highlights[getCanonicalVerseKey(book.id, readerState.chapter, Number(verse.number || 0))]) || [];
  const primaryVerses = visibleVerses.map((verse) => getBibleVerseSnapshot(verse, chapter, version));
  const comparisonChapter = currentParallelChapterData[0];
  const comparisonVersion = getVersion(readerState.parallelVersionIds[0]) || version;
  return {
    status: bibleChapterError ? "error" : bibleChapterLoading ? "loading" : "ready",
    error: bibleChapterError,
    chapter: readerState.chapter,
    versionName: chapter?.versionName || version.name,
    versionLanguage: version.language,
    chapterCount: book.chapters,
    bookId: book.id,
    versionId: version.id,
    bookName: book.name,
    quizSource: {
      reference: `${book.name} ${readerState.chapter}`,
      version: chapter?.versionName || version.name,
      verses: (chapter?.verses || []).filter(verse => Number(verse.number) > 0 && verse.text)
        .map(verse => ({ number: Number(verse.number), text: verse.text })),
    },
    books: BOOKS.map((item) => ({ id: item.id, name: item.name, chapters: item.chapters })),
    sourceLabel: `${book.name} ${readerState.chapter} · ${readerState.parallelEnabled ? "Parallel" : `${getVersionLanguageFlag(version)} ${chapter?.versionName || version.name}`}`,
    copyright: chapter?.copyright || "",
    title: chapter?.title || "",
    parallelEnabled: readerState.parallelEnabled,
    showHighlightsOnly: readerState.showHighlightsOnly,
    verses: primaryVerses,
    quizVerses: (chapter?.verses || []).map((verse) => ({
      number: Number(verse.number || 0),
      text: String(verse.text || ""),
    })),
    parallel: readerState.parallelEnabled
      ? {
        primary: { label: chapter?.version || version.abbreviation, name: chapter?.versionName || version.name },
        compare: { label: comparisonChapter?.version || comparisonVersion.abbreviation, name: comparisonChapter?.versionName || comparisonVersion.name },
        rows: primaryVerses.map((verse) => ({
          ...verse,
          comparisonText: comparisonChapter ? getVerseTextFromChapter(comparisonChapter, verse.number) || "Verse not available in this version." : "Choose a version to compare.",
        })),
      }
      : null,
  };
}
