// Legacy features/home: loaded before script.js; declarations only.
// Shared state remains in script.js during the incremental React migration.

function getTodayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function emitHomeStatsChange() {
  if (homeStatsEmitTimer) return;
  homeStatsEmitTimer = window.setTimeout(() => {
    homeStatsEmitTimer = null;
    window.dispatchEvent(new CustomEvent("home:stats-change", {
      detail: {
        streak: homeStreak?.textContent?.trim() || "1 day",
        continueReading: homeContinueReading?.textContent?.trim() || "John 15",
        prayerCount: homePrayerCount?.textContent?.trim() || "0",
      },
    }));
  }, 80);
}

function initHomeStats() {
  const storageKey = "brother.homeActivity";
  const activity = readJson(storageKey, { lastDate: "", streak: 0 });
  const today = getTodayKey();

  if (activity.lastDate !== today) {
    const previous = activity.lastDate
      ? new Date(`${activity.lastDate}T00:00:00`)
      : null;
    const current = new Date(`${today}T00:00:00`);
    const difference = previous
      ? Math.round((current - previous) / 86400000)
      : null;

    activity.streak = difference === 1 ? Number(activity.streak || 0) + 1 : previous ? 0 : 1;
    activity.lastDate = today;
    writeJson(storageKey, activity);
  }

  if (homeStreak) {
    homeStreak.textContent = `${activity.streak} ${activity.streak === 1 ? "day" : "days"}`;
  }

  applyProfile();
  updateHomeContinueReading();
  updateHomePrayerCount();
  emitHomeStatsChange();
}

function updateHomeContinueReading() {
  if (!homeContinueReading) return;
  const book = BOOKS.find((item) => item.id === readerState.bookId);
  homeContinueReading.textContent = `${book?.name || readerState.bookId} ${readerState.chapter}`;
  emitHomeStatsChange();
}

function updateHomePrayerCount() {
  if (homePrayerCount) {
    homePrayerCount.textContent = String(prayerState.requests.filter((request) => getPrayerStatus(request) === "active").length);
    emitHomeStatsChange();
  }
}

function renderHomeLibraryTab(tab) {
  document.querySelectorAll("[data-home-library-tab]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.homeLibraryTab === tab);
  });
  document.dispatchEvent(new CustomEvent("home:library-tab-active", { detail: { tab } }));
  if (!homeLibraryPanel) return;
  homeLibraryPanel.dataset.homeLibraryView = tab;

  if (window.reactHomeLibraryPanelMounted) {
    document.dispatchEvent(new CustomEvent("home:library-data-change", { detail: { tab } }));
    return;
  }

  const hasSavedContent = tab === "notes"
    ? getSavedNoteRows().length > 0
    : getSavedRows(tab, "").length > 0 || (tab === "bookmarks" && Object.keys(savedState.aiBookmarks).length > 0);

  if (!hasSavedContent) {
    const isConnected = Boolean(supabaseUser);
    homeLibraryPanel.innerHTML = `
      <div class="home-library-empty-state">
        <i data-lucide="${isConnected ? "book-open" : "log-in"}"></i>
        <strong>${isConnected ? "Your library is empty" : "Sign in to see more"}</strong>
        <p>${isConnected
          ? "Save highlights, bookmarks and notes from the Bible tab to find them here."
          : "Sign in to sync your notes, bookmarks and highlights across your devices."}</p>
        <button type="button" data-nav="${isConnected ? "bible" : "profile"}">
          ${isConnected ? "Start reading" : "Sign in or create an account"}
          <i data-lucide="arrow-up-right"></i>
        </button>
      </div>
    `;
    homeLibraryPanel.querySelector("[data-nav]")?.addEventListener("click", (event) => {
      setScreen(event.currentTarget.dataset.nav);
    });
    refreshIcons();
    return;
  }

  renderProfileSavedPanel(tab);
  const fallbackNoteRows = tab === "notes" ? getSavedNoteRows() : [];
  window.unmountProfileSavedNoteCards?.(profileSavedPanel.querySelector("[data-profile-saved-notes-root]"));
  homeLibraryPanel.innerHTML = profileSavedPanel.innerHTML;
  profileSavedPanel.innerHTML = "";
  profileSavedPanel.hidden = true;
  const homeNoteRoot = homeLibraryPanel.querySelector("[data-profile-saved-notes-root]");
  window.renderProfileSavedNoteCards?.(homeNoteRoot, fallbackNoteRows, openSavedNote);
  homeLibraryPanel.querySelector("[data-notes-search]")?.addEventListener("input", (event) => {
    const query = event.target.value.trim().toLowerCase();
    homeLibraryPanel.querySelectorAll("[data-note-searchable]").forEach((card) => {
      card.hidden = Boolean(query) && !card.dataset.noteSearchable.includes(query);
    });
  });
  homeLibraryPanel.querySelectorAll("[data-saved-row]").forEach((button) => {
    button.addEventListener("click", () => openSavedVerse(getSavedRows(tab)[Number(button.dataset.savedRow)]));
  });
  homeLibraryPanel.querySelectorAll("[data-folder-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      activeProfileFolders[tab] = button.dataset.folderFilter;
      renderHomeLibraryTab(tab);
    });
  });
  homeLibraryPanel.querySelectorAll("[data-saved-note]").forEach((button) => {
    button.addEventListener("click", () => openSavedNote(getSavedNoteRows()[Number(button.dataset.savedNote)]));
  });
  homeLibraryPanel.querySelectorAll("[data-nav]").forEach((button) => {
    button.addEventListener("click", () => setScreen(button.dataset.nav));
  });
  bindSavedFolderTriggers(homeLibraryPanel);
  bindFolderSelectInteractions(homeLibraryPanel);
  refreshIcons();
}

function refreshHomeLibraryPanel() {
  const activeButton = [...document.querySelectorAll("[data-home-library-tab]")]
    .find((button) => button.classList.contains("is-active"));
  if (activeButton && homeLibraryPanel) {
    renderHomeLibraryTab(activeButton.dataset.homeLibraryTab);
  }
}
