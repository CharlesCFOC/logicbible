/* Bible module: reader controls, chapter loading and verse actions. */

function initReader() {
  renderVersionOptions();
  renderBookOptions();
  renderChapterOptions();

  versionSelect.addEventListener("change", () => {
    readerState.versionId = versionSelect.value;
    renderParallelOptions();
    loadChapter();
  });

  bookSelect.addEventListener("change", () => {
    readerState.bookId = bookSelect.value;
    readerState.chapter = 1;
    renderChapterOptions();
    loadChapter();
  });

  chapterSelect.addEventListener("change", () => {
    readerState.chapter = Number(chapterSelect.value);
    loadChapter();
  });

  parallelToggle?.addEventListener("click", () => {
    readerState.parallelEnabled = !readerState.parallelEnabled;
    renderParallelOptions();
    loadChapter();
  });

  readerTargetToggle?.addEventListener("click", () => {
    readerState.showHighlightsOnly = !readerState.showHighlightsOnly;
    readerTargetToggle.classList.toggle("is-active", readerState.showHighlightsOnly);
    if (readerState.parallelEnabled) {
      loadChapter();
    } else if (currentChapterData) {
      renderChapter(currentChapterData);
    }
  });

  parallelVersionOne?.addEventListener("change", () => {
    readerState.parallelVersionIds = [parallelVersionOne.value];
    loadChapter();
  });

  document.querySelectorAll("[data-verse-action]").forEach((button) => {
    button.addEventListener("click", () => {
      button.classList.add("is-pressed");
      window.setTimeout(() => button.classList.remove("is-pressed"), 180);
      handleVerseAction(button.dataset.verseAction);
    });
  });

  loadChapter();
  loadRemoteVersions();
}

initReader();
