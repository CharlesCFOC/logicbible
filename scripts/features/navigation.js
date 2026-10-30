// Legacy features/navigation: loaded before script.js; declarations only.
// Shared state remains in script.js during the incremental React migration.

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function setScreen(id) {
  const navigationRequest = new CustomEvent("app:before-screen-change", { cancelable: true, detail: { id } });
  if (!window.dispatchEvent(navigationRequest)) return;
  if (!screens.some((screen) => screen.id === id)) return;
  if (noteEditorPanel?.classList.contains("is-visible")) {
    closeModal();
  }
  const activeNavId = id === "admin" ? "profile" : (id.startsWith("apologetics") ? "apologetics" : id);
  if (id !== "bible" && multiSelectMode) {
    exitMultiSelectMode();
  }
  appShell.dataset.activeScreen = id;
  try {
    window.sessionStorage.setItem(activeScreenStorageKey, id);
  } catch {
    // Navigation still works when browser storage is unavailable.
  }
  bottomNav?.classList.remove("is-scroll-hidden");
  screens.forEach((screen) => {
    screen.classList.toggle("is-active", screen.id === id);
    if (screen.id === id) {
      screen.scrollTop = 0;
    }
  });

  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.nav === activeNavId);
  });

  if (id.startsWith("apologetics") && id !== "apologetics" && id !== "apologetics-debate") {
    renderApologetics();
  }

  if (id === "prayer") {
    renderPrayerPage();
  }

  renderApologeticsBeginButton();
  window.dispatchEvent(new CustomEvent("app:screen-change", {
    detail: { id, activeNavId },
  }));
}

function openHomeMenu() {
  if (!homeMenuLayer || !homeMenuDrawer) return;
  homeMenuLastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  homeMenuLayer.removeAttribute("inert");
  homeMenuLayer.setAttribute("aria-hidden", "false");
  homeMenuLayer.classList.add("is-open");
  homeMenuToggle?.setAttribute("aria-expanded", "true");
  if (!window.appButtonHaptic) navigator.vibrate?.(8);
  window.setTimeout(() => (homeMenuDrawer.querySelector("[data-home-menu-close]") || homeMenuDrawer).focus(), 20);
}

function closeHomeMenu({ restoreFocus = true } = {}) {
  if (!homeMenuLayer?.classList.contains("is-open")) return;
  homeMenuLayer.classList.remove("is-open");
  homeMenuLayer.setAttribute("aria-hidden", "true");
  homeMenuLayer.setAttribute("inert", "");
  homeMenuToggle?.setAttribute("aria-expanded", "false");
  if (restoreFocus && homeMenuLastFocusedElement?.isConnected) {
    homeMenuLastFocusedElement.focus();
  }
}

function keepHomeMenuFocus(event) {
  if (event.key !== "Tab" || !homeMenuLayer?.classList.contains("is-open") || !homeMenuDrawer) return;
  const focusable = [...homeMenuDrawer.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.hasAttribute("hidden"));
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function showModal(panel) {
  const isNotePanel = panel === noteEditorPanel;
  if (!isNotePanel) {
    [verseSheet, verseAiPanel, noteEditorPanel].forEach((item) => item?.classList.remove("is-visible"));
  } else {
    verseSheet?.classList.remove("is-visible");
    verseAiPanel?.classList.remove("is-visible");
  }
  modalLayer.hidden = false;
  panel.classList.add("is-visible");
  appShell.dataset.modal = panel === verseSheet ? "verse" : panel === verseAiPanel ? "verse-ai" : isNotePanel ? "note" : "standard";
  if (isNotePanel) bottomNav?.classList.remove("is-scroll-hidden");
  if (panel === verseSheet) {
    readerScreen?.classList.add("is-verse-focused");
    window.requestAnimationFrame(centerSelectedVerse);
  }
  const input = panel.querySelector("input, textarea");
  if (input) {
    window.setTimeout(() => input.focus(), 80);
  }
}

function closeModal(options = {}) {
  if (noteEditorPanel?.classList.contains("is-visible")) {
    saveRichNote();
  }
  if (noteEditorPanel?.classList.contains("is-visible") && !options.preserveNoteAddMode) {
    noteEditorAddingVerses = false;
  }
  [verseSheet, verseAiPanel, noteEditorPanel].forEach((item) => item?.classList.remove("is-visible"));
  verseSheet?.classList.remove("is-original-language");
  modalLayer.hidden = true;
  delete appShell.dataset.modal;
  readerScreen?.classList.remove("is-verse-focused");
  document.querySelectorAll(".scripture-line.is-selected, .parallel-scripture-line.is-selected").forEach((line) => line.classList.remove("is-selected"));
  hideVerseDetail();
}
