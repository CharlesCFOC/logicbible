import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { HomeBibleTimeline, HomeHero, HomeLibraryPanel, HomeLibraryTabs, HomePrayerCard, HomeStats } from "./home.jsx";
import { ProfileCloudAccount, ProfileHero, ProfileInformation, ProfilePreferences, ProfileTabs } from "./profile.jsx";
import { BibleChapterContent, BibleParallelControls, BibleReaderControls, BibleSelectedVerse, BibleSheetFeedback, BibleVerseActions } from "./bible.jsx";
import { NoteEditorContent, NoteEditorHeader, NoteEditorVerseChips, NoteToolbar } from "./notes.jsx";
import { PrayerPage } from "./prayer.jsx";
import { AiPage } from "./ai.jsx";
import { KidsBiblePage } from "./kids-bible.jsx";

const navigationItems = [
  ["home", "Home", "home"],
  ["bible", "Bible", "book"],
  ["kids-bible", "Kids Bible", "image"],
  ["prayer", "Prayer", "heart"],
  ["ai", "AI", "sparkles"],
  ["apologetics", "Apologetics", "shield"],
  ["profile", "Profile", "user"],
];

const iconPaths = {
  home: ["M3 10.5 12 3l9 7.5", "M5 9.5V21h14V9.5", "M9 21v-6h6v6"],
  book: ["M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22.5z", "M4 5.5v17", "M8 7h8"],
  image: ["M4 4h16v16H4z", "m4 16 4-4 3 3 3-4 6 6", "M9 8.5h.01"],
  heart: ["M20.8 8.8c0 5.4-8.8 10.2-8.8 10.2S3.2 14.2 3.2 8.8A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.7Z", "M7 15h4l2-3 2 2h3"],
  sparkles: ["m12 3-1.3 5.7L5 10l5.7 1.3L12 17l1.3-5.7L19 10l-5.7-1.3z", "m5 17-.6 2.4L2 20l2.4.6L5 23l.6-2.4L8 20l-2.4-.6z", "m19 3-.5 1.5L17 5l1.5.5L19 7l.5-1.5L21 5l-1.5-.5z"],
  shield: ["M12 3 20 6v5c0 5.2-3.4 8.8-8 10-4.6-1.2-8-4.8-8-10V6z", "m8.5 12 2.2 2.2 4.8-5"],
  user: ["M20 21a8 8 0 0 0-16 0", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8"],
};

function NavigationIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {iconPaths[name].map((path) => <path key={path} d={path} />)}
    </svg>
  );
}

function BottomNavigation() {
  const initialScreen = document.querySelector(".app-shell")?.dataset.activeScreen || "home";
  const [activeScreen, setActiveScreen] = useState(initialScreen);

  useEffect(() => {
    const handleScreenChange = (event) => setActiveScreen(event.detail?.activeNavId || event.detail?.id || "home");
    window.addEventListener("app:screen-change", handleScreenChange);
    return () => window.removeEventListener("app:screen-change", handleScreenChange);
  }, []);

  const navigate = (id) => {
    setActiveScreen(id);
    if (typeof window.appNavigate === "function") {
      window.appNavigate(id);
    } else {
      window.dispatchEvent(new CustomEvent("app:navigate", { detail: { id } }));
    }
  };

  const triggerNavigationHaptic = (event) => {
    if (event.pointerType === "touch") {
      navigator.vibrate?.(8);
    }
  };

  return navigationItems.map(([id, label, icon]) => (
    <button key={id} className={activeScreen === id ? "is-active" : ""} data-nav={id} type="button" onPointerDown={triggerNavigationHaptic} onClick={() => navigate(id)}>
      <NavigationIcon name={icon} />
      <span>{label}</span>
    </button>
  ));
}

const mountNode = document.querySelector("[data-react-navigation-root]");
if (mountNode) {
  createRoot(mountNode).render(<BottomNavigation />);
}

const homeHeroNode = document.querySelector("[data-react-home-hero-root]");
if (homeHeroNode) {
  createRoot(homeHeroNode).render(<HomeHero />);
}

const homeStatsNode = document.querySelector("[data-react-home-stats-root]");
if (homeStatsNode) {
  createRoot(homeStatsNode).render(<HomeStats />);
}

const homePrayerNode = document.querySelector("[data-react-home-prayer-root]");
if (homePrayerNode) {
  createRoot(homePrayerNode).render(<HomePrayerCard />);
}

const homeTimelineNode = document.querySelector("[data-react-home-timeline-root]");
if (homeTimelineNode && window.homeTimelineBridge) {
  createRoot(homeTimelineNode).render(<HomeBibleTimeline />);
}

const homeLibraryTabsNode = document.querySelector("[data-react-home-library-tabs-root]");
if (homeLibraryTabsNode) {
  createRoot(homeLibraryTabsNode).render(<HomeLibraryTabs />);
}

const homeLibraryPanelNode = document.querySelector("[data-react-home-library-panel-root]");
if (homeLibraryPanelNode && window.homeLibraryBridge) {
  window.reactHomeLibraryPanelMounted = true;
  createRoot(homeLibraryPanelNode).render(<HomeLibraryPanel />);
}

const profileTabsNode = document.querySelector("[data-react-profile-tabs-root]");
if (profileTabsNode) {
  createRoot(profileTabsNode).render(<ProfileTabs />);
}

const profileHeroNode = document.querySelector("[data-react-profile-hero-root]");
if (profileHeroNode && window.profileBridge) {
  createRoot(profileHeroNode).render(<ProfileHero />);
}

const profilePreferencesNode = document.querySelector("[data-react-profile-preferences-root]");
if (profilePreferencesNode && window.profileBridge) {
  createRoot(profilePreferencesNode).render(<ProfilePreferences />);
}

const profileInformationNode = document.querySelector("[data-react-profile-information-root]");
if (profileInformationNode && window.profileBridge) {
  createRoot(profileInformationNode).render(<ProfileInformation />);
}

const profileCloudNode = document.querySelector("[data-react-profile-cloud-root]");
if (profileCloudNode && window.profileBridge) {
  createRoot(profileCloudNode).render(<ProfileCloudAccount />);
}

const bibleControlsNode = document.querySelector("[data-react-bible-controls-root]");
if (bibleControlsNode && window.bibleReaderBridge) {
  createRoot(bibleControlsNode).render(<BibleReaderControls />);
}

const bibleParallelNode = document.querySelector("[data-react-bible-parallel-root]");
if (bibleParallelNode && window.bibleReaderBridge) {
  createRoot(bibleParallelNode).render(<BibleParallelControls />);
}

const bibleChapterNode = document.querySelector("[data-react-bible-chapter-root]");
if (bibleChapterNode && window.bibleReaderBridge) {
  window.reactBibleChapterMounted = true;
  createRoot(bibleChapterNode).render(<BibleChapterContent />);
}

const selectedVerseNode = document.querySelector("[data-react-selected-verse-root]");
if (selectedVerseNode && window.bibleReaderBridge) {
  createRoot(selectedVerseNode).render(<BibleSelectedVerse />);
}

const sheetFeedbackNode = document.querySelector("[data-react-sheet-feedback-root]");
if (sheetFeedbackNode && window.bibleReaderBridge) {
  createRoot(sheetFeedbackNode).render(<BibleSheetFeedback />);
}

const verseActionsNode = document.querySelector("[data-react-verse-actions-root]");
if (verseActionsNode && window.bibleReaderBridge) {
  createRoot(verseActionsNode).render(<BibleVerseActions />);
}

const noteToolbarNode = document.querySelector("[data-react-note-toolbar-root]");
if (noteToolbarNode && window.noteEditorBridge) {
  createRoot(noteToolbarNode).render(<NoteToolbar />);
}

const noteContentNode = document.querySelector("[data-react-note-content-root]");
if (noteContentNode && window.noteEditorBridge) {
  createRoot(noteContentNode).render(<NoteEditorContent />);
}

const noteHeaderNode = document.querySelector("[data-react-note-header-root]");
if (noteHeaderNode && window.noteEditorBridge) {
  createRoot(noteHeaderNode).render(<NoteEditorHeader />);
}

const noteChipsNode = document.querySelector("[data-react-note-chips-root]");
if (noteChipsNode && window.noteEditorBridge) {
  createRoot(noteChipsNode).render(<NoteEditorVerseChips />);
}

const prayerNode = document.querySelector("[data-react-prayer-root]");
if (prayerNode && window.prayerBridge) {
  createRoot(prayerNode).render(<PrayerPage />);
}

const aiNode = document.querySelector("[data-react-ai-root]");
if (aiNode && window.aiBridge) {
  createRoot(aiNode).render(<AiPage />);
}

const kidsBibleNode = document.querySelector("[data-react-kids-bible-root]");
if (kidsBibleNode && window.kidsBibleBridge) {
  createRoot(kidsBibleNode).render(<KidsBiblePage />);
}
