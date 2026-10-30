// Adapter used by React; installed at the original bootstrap point.
function installBibleReaderBridge() {
window.bibleReaderBridge = {
  async prepareStudy(bookId, chapterNumber) {
    const book = BOOKS.find(item => item.id === bookId);
    if (!book) throw new Error("Please choose a book.");
    readerState.bookId = book.id;
    readerState.chapter = Math.max(1, Math.min(book.chapters, Number(chapterNumber) || 1));
    renderBookOptions();
    renderChapterOptions();
    const chapter = await loadChapter();
    if (!chapter) throw new Error(bibleChapterError || "Could not load this chapter. Please try again.");
  },
  openStudy() {
    setScreen("bible");
    if (appShell.dataset.activeScreen === "bible") {
      document.querySelector('#bible [data-bible-menu-toggle]')?.click();
    }
  },
  async createChapterQuiz(source, signal) {
    const response = await aiFetch(apiUrl("/api/ai/chapter-quiz"), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(source), signal,
    });
    return readQuizResponse(response);
  },
  getChapterSnapshot() {
    return getBibleChapterSnapshot();
  },
  getSnapshot() {
    const { popular, rest } = sortVersionsForMenu(readerState.versions);
    const versionOptions = [
      ...popular.map((version) => ({ id: version.id, label: getVersionMenuLabel(version) })),
      ...(popular.length && rest.length ? [{ separator: true }] : []),
      ...rest.map((version) => ({ id: version.id, label: getVersionMenuLabel(version) })),
    ];
    const parallelOptions = readerState.versions
      .filter((version) => version.id !== readerState.versionId)
      .map((version) => ({ id: version.id, label: getVersionMenuLabel(version) }));
    return {
      versionId: readerState.versionId,
      bookId: readerState.bookId,
      chapter: readerState.chapter,
      parallelEnabled: readerState.parallelEnabled,
      showHighlightsOnly: readerState.showHighlightsOnly,
      parallelVersionId: readerState.parallelVersionIds[0] || "",
      versionOptions,
      parallelOptions,
      books: BOOKS.map((book) => ({ id: book.id, name: book.name, chapters: book.chapters })),
      chapters: Array.from({ length: getBook(readerState.bookId).chapters }, (_, index) => index + 1),
    };
  },
  setVersion(value) {
    readerState.versionId = value;
    renderParallelOptions();
    loadChapter();
  },
  setBook(value) {
    readerState.bookId = value;
    readerState.chapter = 1;
    renderChapterOptions();
    loadChapter();
  },
  setChapter(value) {
    const book = getBook(readerState.bookId);
    readerState.chapter = Math.max(1, Math.min(book.chapters, Number(value) || 1));
    renderChapterOptions();
    loadChapter();
  },
  changeChapter(delta) {
    const currentBookIndex = BOOKS.findIndex((book) => book.id === readerState.bookId);
    if (currentBookIndex < 0) return;

    const direction = Number(delta) < 0 ? -1 : 1;
    let nextBookIndex = currentBookIndex;
    let nextChapter = readerState.chapter + direction;

    if (nextChapter < 1) {
      nextBookIndex -= 1;
      if (nextBookIndex < 0) return;
      nextChapter = BOOKS[nextBookIndex].chapters;
    } else if (nextChapter > BOOKS[currentBookIndex].chapters) {
      nextBookIndex += 1;
      if (nextBookIndex >= BOOKS.length) return;
      nextChapter = 1;
    }

    readerState.bookId = BOOKS[nextBookIndex].id;
    readerState.chapter = nextChapter;
    renderBookOptions();
    renderChapterOptions();
    loadChapter();
  },
  toggleParallel() {
    readerState.parallelEnabled = !readerState.parallelEnabled;
    renderParallelOptions();
    loadChapter();
  },
  toggleTarget() {
    readerState.showHighlightsOnly = !readerState.showHighlightsOnly;
    renderParallelOptions();
    if (readerState.parallelEnabled) {
      loadChapter();
    } else if (currentChapterData) {
      renderChapter(currentChapterData);
    }
  },
  setParallelVersion(value) {
    readerState.parallelVersionIds = [value];
    loadChapter();
  },
  getVerseSnapshot() {
    return {
      reference: selectedVerseData
        ? (multiSelectedVerseData.length > 1 ? `${multiSelectedVerseData.length} verses selected` : selectedVerseData.reference)
        : "John 15:5",
      feedback: sheetFeedback?.textContent || "",
      languageLabel: getOriginalLanguage(readerState.bookId).label,
      active: {
        highlight: Boolean(selectedVerseData && savedState.highlights[selectedVerseData.highlightKey]),
        bookmark: Boolean(selectedVerseData && savedState.bookmarks[selectedVerseData.key]),
        parallel: readerState.parallelEnabled,
      },
      selectedKey: selectedVerseData?.key || "",
      selectedKeys: multiSelectedVerseData.map((item) => item.key),
      multiSelectMode,
    };
  },
  selectVerse(data) {
    if (!data) return;
    if (multiSelectMode) {
      toggleMultiSelectedData(data);
      return;
    }
    multiSelectedVerseData = [];
    closeNoteTooltips();
    selectedVerseData = { ...data };
    document.querySelectorAll(".scripture-line.is-selected, .parallel-scripture-line.is-selected").forEach((line) => line.classList.remove("is-selected"));
    const selectedLine = document.querySelector(`[data-verse-key="${CSS.escape(data.key)}"]`);
    selectedLine?.classList.add("is-selected");
    hideVerseDetail();
    sheetFeedback.textContent = "";
    syncVerseActionStates();
    showModal(verseSheet);
    emitBibleVerseUiChange();
  },
  startMultiSelect(data) {
    if (!data) return;
    multiSelectMode = true;
    multiSelectedVerseData = [{ ...data }];
    selectedVerseData = multiSelectedVerseData[0];
    updateMultiSelectionUi();
    setFeedback("Tap other verses to select them.");
  },
  toggleMultiSelect(data) {
    if (data) toggleMultiSelectedData(data);
  },
  runAction(action) {
    return handleVerseAction(action);
  },
};
}
