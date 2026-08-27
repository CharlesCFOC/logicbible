const screens = [...document.querySelectorAll("[data-screen]")];
const navButtons = [...document.querySelectorAll("[data-nav]")];
const kidsBibleLibrary = document.querySelector("[data-kids-library]");
const kidsBibleReader = document.querySelector("[data-kids-reader]");
const kidsBiblePageImage = document.querySelector("[data-kids-page-image]");
const kidsBibleImageWrap = document.querySelector(".kids-reader-image-wrap");
const kidsBiblePageLabel = document.querySelector("[data-kids-page-label]");
const kidsBiblePageSelect = document.querySelector("[data-kids-page-select]");
const kidsBibleProgress = document.querySelector("[data-kids-progress]");
const kidsBibleReaderTitle = document.querySelector("[data-kids-reader-title]");
const kidsBibleBooks = {
  matthew: {
    title: "Matthew",
    totalPages: 37,
    imageDir: "assets/kids-bible/matthew",
    getFileName: (number) => `${number}_Matthew_Comic_Page_Modern_English.jpg`,
  },
  mark: {
    title: "Mark",
    totalPages: 16,
    imageDir: "assets/kids-bible/mark",
    getFileName: (number) => `${number}.webp`,
  },
  luke: {
    title: "Luke",
    totalPages: 21,
    imageDir: "assets/kids-bible/luke",
    getFileName: (number) => `${number}.webp`,
  },
};
const initialKidsBibleBookId = kidsBibleBooks[localStorage.getItem("brother.kidsBibleBook")] ? localStorage.getItem("brother.kidsBibleBook") : "matthew";

function getKidsBibleBook(bookId = initialKidsBibleBookId) {
  return kidsBibleBooks[bookId] || kidsBibleBooks.matthew;
}

function getKidsBiblePageStorageKey(bookId) {
  return `brother.kidsBiblePage.${bookId}`;
}

function readKidsBiblePage(bookId) {
  const book = getKidsBibleBook(bookId);
  const storedPage = localStorage.getItem(getKidsBiblePageStorageKey(bookId))
    || (bookId === "matthew" ? localStorage.getItem("brother.kidsBiblePage") : null)
    || "1";
  return Math.max(1, Math.min(book.totalPages, Number(storedPage) || 1));
}

const kidsBibleState = {
  bookId: initialKidsBibleBookId,
  page: readKidsBiblePage(initialKidsBibleBookId),
};
const appShell = document.querySelector(".app-shell");
const modalLayer = document.querySelector("[data-modal-layer]");
const searchPanel = document.querySelector("[data-search-panel]");
const verseSheet = document.querySelector("[data-verse-sheet]");
const verseAiPanel = document.querySelector("[data-verse-ai-panel]");
const noteEditorPanel = document.querySelector("[data-note-editor-panel]");
let noteEditorContent = document.querySelector("[data-note-editor-content]");
const noteEditorReference = document.querySelector("[data-note-editor-reference]");
const noteEditorStatus = document.querySelector("[data-note-editor-status]");
const noteEditorVerseChips = document.querySelector("[data-note-editor-verse-chips]");
const noteEditorTitle = document.querySelector("[data-note-title]");
const saveRichNoteButton = document.querySelector("[data-save-rich-note]");
const noteFontSizeInput = document.querySelector("[data-note-font-size]");
const noteFontSizeValue = document.querySelector("[data-note-font-size-value]");
const noteFontSizeDecreaseButton = document.querySelector("[data-note-size-decrease]");
const noteFontSizeIncreaseButton = document.querySelector("[data-note-size-increase]");
let noteEditorCursorLine = null;
const selectedVerse = document.querySelector("[data-selected-verse]");
const sheetFeedback = document.querySelector("[data-sheet-feedback]");
const verseDetail = document.querySelector("[data-verse-detail]");
const readerScreen = document.querySelector("#bible");
const bottomNav = document.querySelector(".bottom-nav");
const verseAiReference = document.querySelector("[data-verse-ai-reference]");
const verseAiContext = document.querySelector("[data-verse-ai-context]");
const verseAiThread = document.querySelector("[data-verse-ai-thread]");
const verseAiForm = document.querySelector("[data-verse-ai-form]");
const verseAiInput = verseAiForm?.querySelector("input");
const multiSelectMenuToggle = document.querySelector("[data-multi-select-toggle]");
const noteAddSaveButton = document.querySelector("[data-note-add-save]");
const aiComposerInput = document.querySelector(".composer textarea");
const aiForm = document.querySelector("[data-ai-form]");
const aiThread = document.querySelector("[data-ai-thread]");
const newAiChatButton = document.querySelector("[data-new-ai-chat]");
const apologeticsTracks = document.querySelector("[data-apologetics-tracks]");
const apologeticsFilters = document.querySelector("[data-apologetics-filters]");
const apologeticsTopicCount = document.querySelector("[data-apologetics-topic-count]");
const apologeticsTopics = document.querySelector("[data-apologetics-topics]");
const apologeticsChallenge = document.querySelector("[data-apologetics-challenge]");
const apologeticsProgress = document.querySelector("[data-apologetics-progress]");
const apologeticsTrackTitle = document.querySelector("[data-apologetics-track-title]");
const apologeticsTrackHero = document.querySelector("[data-apologetics-track-hero]");
const apologeticsTrackProgress = document.querySelector("[data-apologetics-track-progress]");
const apologeticsTrackQuick = document.querySelector("[data-apologetics-track-quick]");
const apologeticsTrackRewards = document.querySelector("[data-apologetics-track-rewards]");
const apologeticsSelectionLine = document.querySelector("[data-apologetics-selection-line]");
const apologeticsTrackTopics = document.querySelector("[data-apologetics-track-topics]");
const apologeticsBeginButton = document.querySelector("[data-apologetics-begin]");
const apologeticsTopicBreadcrumb = document.querySelector("[data-apologetics-topic-breadcrumb]");
const apologeticsTopicTitle = document.querySelector("[data-apologetics-topic-title]");
const apologeticsDetail = document.querySelector("[data-apologetics-detail]");
const apologeticsChatTabs = document.querySelector("[data-apologetics-chat-tabs]");
const apologeticsChatThread = document.querySelector("[data-apologetics-chat-thread]");
const apologeticsChatForm = document.querySelector("[data-apologetics-chat-form]");
const apologeticsChatInput = apologeticsChatForm?.querySelector("textarea");
const apologeticsTopicTabs = document.querySelector("[data-apologetics-topic-tabs]");
const apologeticsGate = document.querySelector("[data-apologetics-gate]");
const apologeticsGateForm = document.querySelector("[data-apologetics-gate-form]");
const apologeticsGateInput = apologeticsGateForm?.querySelector("input");
const apologeticsGateFeedback = document.querySelector("[data-apologetics-gate-feedback]");
const aiMemoryKey = "brother.aiMemory";
const aiConversationsKey = "brother.aiConversations";
const aiBookmarksKey = "brother.aiBookmarks";
const apologeticsChatKey = "brother.apologeticsChat";
const apologeticsProgressKey = "brother.apologeticsProgress";
const apologeticsGateSessionKey = "brother.apologeticsUnlocked";
const debateXpKey = "brother.debateXp";
const pendingSyncKey = "app.pendingSync";
const aiMemoryTtlMs = 24 * 60 * 60 * 1000;
const maxAiMemoryMessages = 24;
const aiTabs = [...document.querySelectorAll("[data-ai-tab]")];
const aiHistoryPanel = document.querySelector("[data-ai-history-panel]");
let currentAiConversationId = localStorage.getItem("brother.aiConversationId") || `chat-${Date.now()}`;

let supabaseClient = null;
let supabaseUser = null;
let isHydratingSupabase = false;

const apologeticsTrackUi = {
  islam: {
    summary: "Main objections about Jesus, the Bible, and the crucifixion.",
    frameworkDetails: [
      {
        title: "Listen carefully",
        explanation: "Let the Muslim objection come out fully before answering. You need the real claim, not a simplified version.",
        example: "If someone says the Bible was corrupted, ask whether they mean transmission, translation, or doctrine.",
        mistakes: "Interrupting too early or assuming every objection means the same thing.",
        tip: "Repeat the objection back in one sentence before you answer.",
      },
      {
        title: "Identify the objection",
        explanation: "Find the exact pressure point: Jesus, Scripture, crucifixion, or Trinity. That determines your route.",
        example: "A challenge about Jesus praying to the Father is not the same as a challenge about John 1:1.",
        mistakes: "Using a Trinity answer when the real issue is textual reliability.",
        tip: "Name the category out loud so the discussion stays focused.",
      },
      {
        title: "Answer from Scripture",
        explanation: "Use a few clear passages and explain them simply instead of stacking too many references.",
        example: "For Christ’s deity, combine John 1:1, John 8:58, and Colossians 2:9 with a short explanation.",
        mistakes: "Dropping verses without context or turning the answer into a sermon.",
        tip: "Aim for one short answer, one explanation, and one follow-up verse.",
      },
      {
        title: "Stay calm",
        explanation: "Your tone matters. A calm answer shows confidence and keeps the conversation open.",
        example: "Answer historical objections with patience before moving into theology.",
        mistakes: "Sounding combative or mocking the other worldview.",
        tip: "Slow down your pace when the objection becomes emotional.",
      },
    ],
  },
  "jehovahs-witnesses": {
    summary: "Main objections about Christ's deity, translation choices, and doctrine.",
    frameworkDetails: [
      {
        title: "Define the term",
        explanation: "Many disagreements start with loaded words like firstborn, god, or worship. Clarify the term first.",
        example: "Ask what they mean by firstborn in Colossians 1 before debating the whole verse.",
        mistakes: "Arguing past the definition and missing the real interpretive issue.",
        tip: "Start with the text and define the disputed word in context.",
      },
      {
        title: "Check the context",
        explanation: "Read the surrounding verses carefully. The strongest answer usually comes from the immediate context.",
        example: "In John 1, the whole prologue gives the force of verse 1.",
        mistakes: "Building the case from one isolated phrase only.",
        tip: "Read at least 3 to 5 verses before and after the objection text.",
      },
      {
        title: "Use clear passages",
        explanation: "Lead with texts that most directly show who Christ is and how He relates to creation and worship.",
        example: "Use Hebrews 1 when the issue is whether Jesus is just an angelic being.",
        mistakes: "Choosing obscure proof texts before the clearest ones.",
        tip: "Start from the clearest passages, then return to the disputed verse.",
      },
      {
        title: "Keep the point simple",
        explanation: "Do not bury the answer in grammar debates unless the other person can follow them.",
        example: "Explain John 1 with the flow of the chapter before discussing technical syntax.",
        mistakes: "Trying to win with complexity instead of clarity.",
        tip: "If you cannot summarize the answer in two sentences, simplify it.",
      },
    ],
  },
  atheism: {
    summary: "Main objections about reason, suffering, evidence, and the resurrection.",
    frameworkDetails: [
      {
        title: "Clarify the claim",
        explanation: "Ask whether the objection is emotional, philosophical, historical, or scientific before you respond.",
        example: "The problem of evil can be a personal cry for help or a philosophical argument against God.",
        mistakes: "Answering a personal pain point like it is only an abstract debate.",
        tip: "Ask one clarifying question before giving your main answer.",
      },
      {
        title: "Expose the assumption",
        explanation: "Many objections hide assumptions about morality, miracles, or what counts as evidence.",
        example: "If someone says miracles are impossible, ask why nature must be a closed system.",
        mistakes: "Accepting the other worldview’s assumptions without testing them.",
        tip: "Surface the hidden assumption in one calm sentence.",
      },
      {
        title: "Give evidence",
        explanation: "Use historical facts, logical coherence, and biblical framing together rather than emotion alone.",
        example: "For the resurrection, establish early testimony, witnesses, and rival explanations.",
        mistakes: "Speaking only in generalities when the question asks for evidence.",
        tip: "Use three facts, not ten arguments.",
      },
      {
        title: "Invite reflection",
        explanation: "A good apologetic answer does not just refute; it also pushes the other person to think deeper.",
        example: "Ask what grounds objective moral outrage if the universe is morally indifferent.",
        mistakes: "Ending the conversation after your own answer without turning the question back.",
        tip: "Finish with one question that exposes the worldview gap.",
      },
    ],
  },
};

const topicDifficultyMinutes = {
  Essential: 8,
  Intermediate: 12,
  Beginner: 6,
};

const topicDifficultyXp = {
  Essential: 80,
  Intermediate: 120,
  Beginner: 60,
};

const versionSelect = document.querySelector("[data-version-select]");
const bookSelect = document.querySelector("[data-book-select]");
const chapterSelect = document.querySelector("[data-chapter-select]");
const versesList = document.querySelector("[data-verses-list]");
const readerSource = document.querySelector("[data-reader-source]");
const readerChapter = document.querySelector("[data-reader-chapter]");
const copyrightNote = document.querySelector("[data-copyright-note]");
const originalLanguageLabel = document.querySelector('[data-verse-action="original-language"] span');
const parallelToggle = document.querySelector("[data-parallel-toggle]");
const readerTargetToggle = document.querySelector("[data-reader-target]");
const parallelSelects = document.querySelector("[data-parallel-selects]");
const parallelVersionOne = document.querySelector("[data-parallel-version-one]");
const backgroundOptionsTrack = document.querySelector("[data-background-options]");
const backgroundOptionButtons = [...document.querySelectorAll("[data-background-option]")];
const textSizeOptionButtons = [...document.querySelectorAll("[data-text-size-option]")];
const accentOptionButtons = [...document.querySelectorAll("[data-accent-option]")];
const profileAvatar = document.querySelector("[data-profile-avatar]");
const profileCover = document.querySelector("[data-profile-cover]");
const profileStyleToggle = document.querySelector("[data-profile-style-toggle]");
const profileStyleEditor = document.querySelector("[data-profile-style-editor]");
const profileCoverInput = document.querySelector("[data-profile-cover-input]");
const profileCoverReset = document.querySelector("[data-profile-cover-reset]");
const profileStyleFeedback = document.querySelector("[data-profile-style-feedback]");
const profileName = document.querySelector("[data-profile-name]");
const profileStreak = document.querySelector("[data-profile-streak]");
const profileForm = document.querySelector("[data-profile-form]");
const profileFormFeedback = document.querySelector("[data-profile-form-feedback]");
const profileAuthStatus = document.querySelector("[data-profile-auth-status]");
const profileStorageStatus = document.querySelector("[data-profile-storage-status]");
const profileAccountId = document.querySelector("[data-profile-account-id]");
const profileViewButtons = [...document.querySelectorAll("[data-profile-view]")];
const homeLibraryPanel = document.querySelector("[data-home-library-panel]");
const profileSettingsPanel = document.querySelector('[data-profile-panel="settings"]');
const profileSavedPanel = document.querySelector("[data-profile-saved-panel]");
const authForm = document.querySelector("[data-auth-form]");
const authModeLabel = document.querySelector("[data-auth-mode-label]");
const authFeedback = document.querySelector("[data-auth-feedback]");
const authSignInButton = document.querySelector('[data-auth-action="sign-in"]');
const authSignUpButton = document.querySelector('[data-auth-action="sign-up"]');
const authSignOutButton = document.querySelector('[data-auth-action="sign-out"]');
const authForgotButton = document.querySelector('[data-auth-action="forgot"]');
const passwordToggleButtons = [...document.querySelectorAll("[data-password-toggle]")];
const authConnectedEmail = document.querySelector("[data-auth-connected-email]");
const authConnectedEmailValue = document.querySelector("[data-auth-connected-email-value]");
const homeStreak = document.querySelector("[data-home-streak]");
const peopleOnline = document.querySelector("[data-people-online]");
const homeContinueReading = document.querySelector("[data-home-continue-reading]");
const homePrayerCount = document.querySelector("[data-home-prayer-count]");
let peopleOnlineValue = Number(peopleOnline?.textContent) || 128;
let peopleOnlineInterval = null;
let peopleOnlineAnimationFrame = null;
let homeStatsEmitTimer = null;
const prayerForm = document.querySelector("[data-prayer-form]");
const prayerRequestPanel = document.querySelector("[data-prayer-request-panel]");
const prayerList = document.querySelector("[data-prayer-list]");
const prayerBoardContent = document.querySelector("[data-prayer-board-content]");
const prayerBoardToggle = document.querySelector("[data-prayer-board-toggle]");
const prayerBoardLabel = document.querySelector("[data-prayer-board-label]");
const prayerFeedback = document.querySelector("[data-prayer-feedback]");
const prayerWordCount = document.querySelector("[data-prayer-word-count]");
const prayerCategory = document.querySelector("[data-prayer-category]");
const prayerCategoryOptions = [...document.querySelectorAll("[data-prayer-category-option]")];
const prayerBackgroundOptions = [...document.querySelectorAll("[data-prayer-background-option]")];
let selectedPrayerBackgroundIndex = 0;
const prayerUrgent = document.querySelector("[data-prayer-urgent]");
const prayerRequestInput = prayerForm?.querySelector("textarea");
const prayerSubmitButton = prayerForm?.querySelector('button[type="submit"]');
const prayerSubmitLabel = prayerSubmitButton?.querySelector("span");
let prayerSubmitResetTimer = null;
const prayerUserId = localStorage.getItem("brother.prayerUserId") || (() => {
  const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  localStorage.setItem("brother.prayerUserId", id);
  return id;
})();
const storedPrayerRequests = readJson("brother.prayerRequests", []);
const cleanedPrayerRequests = Array.isArray(storedPrayerRequests)
  ? storedPrayerRequests.filter((request) => !request.demo)
  : [];
if (cleanedPrayerRequests.length !== (Array.isArray(storedPrayerRequests) ? storedPrayerRequests.length : 0)) {
  writeJson("brother.prayerRequests", cleanedPrayerRequests);
}
const prayerState = {
  requests: cleanedPrayerRequests,
  tab: "all",
  sort: "most",
  filter: "all",
  pageTab: "board",
  myWallExpanded: false,
};
let prayerBridgeFeedback = "";
let prayerBridgeSent = false;

const PRAYER_BACKGROUND_COUNT = 6;
const prayerBackgroundAssignments = readJson("brother.prayerBackgrounds", {});

function getPrayerBackgroundIndex(request) {
  if (Number.isInteger(request.backgroundIndex)) {
    return request.backgroundIndex % PRAYER_BACKGROUND_COUNT;
  }

  const requestId = String(request.id || "");
  if (requestId && Number.isInteger(prayerBackgroundAssignments[requestId])) {
    return prayerBackgroundAssignments[requestId];
  }

  let hash = 0;
  for (const character of requestId) {
    hash = (hash * 31 + character.charCodeAt(0)) | 0;
  }
  const index = Math.abs(hash || Math.floor(Math.random() * PRAYER_BACKGROUND_COUNT)) % PRAYER_BACKGROUND_COUNT;
  if (requestId) {
    prayerBackgroundAssignments[requestId] = index;
    writeJson("brother.prayerBackgrounds", prayerBackgroundAssignments);
  }
  return index;
}

const readerState = {
  versionId: localStorage.getItem("brother.version") || "local-kjv",
  bookId: localStorage.getItem("brother.book") || "JHN",
  chapter: Number(localStorage.getItem("brother.chapter") || 15),
  versions: [...LOCAL_VERSIONS],
  showHighlightsOnly: false,
  parallelEnabled: localStorage.getItem("brother.parallel") === "true",
  parallelVersionIds: readJson("brother.parallelVersions", ["local-kjv"]),
};
let chapterRequestId = 0;
const bibleChapterCache = new Map();
let selectedVerseData = null;
let multiSelectMode = false;
let multiSelectedVerseData = [];
let noteEditorVerseItems = [];
let noteEditorRemovedVerseKeys = new Set();
let noteEditorFontSize = 17;
let noteEditorGroupId = "";
let noteEditorSelectionRange = null;
let noteEditorAddingVerses = false;
let noteEditorNoteTitle = "";
let noteAutosaveTimer = null;

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
let multiLongPressTimer = null;
let suppressVerseClickUntil = 0;
let verseAiContextData = null;
let currentChapterData = null;
let currentParallelChapterData = [];
let bibleChapterLoading = true;
let bibleChapterError = "";
let activeProfileView = "";
let profileAuthBridgeFeedback = "";
const activeProfileFolders = {
  bookmarks: "",
  highlights: "",
};

const savedState = {
  highlights: readJson("brother.highlights", {}),
  bookmarks: readJson("brother.bookmarks", {}),
  notes: readJson("brother.notes", {}),
  aiBookmarks: readJson(aiBookmarksKey, {}),
};
const savedFolders = {
  bookmarks: [],
  highlights: [],
  ...readJson("brother.savedFolders", {}),
};
const defaultPreferences = {
  background: "black",
  textSize: "medium",
  accent: "taupe",
};
const defaultProfile = {
  displayName: "Charles",
  coverImage: "assets/profile-hero-v2.png",
  email: "",
  country: "",
  dateOfBirth: "",
  avatarInitials: "CB",
  bio: "Focused on Scripture, apologetics, and daily spiritual growth.",
  streakLabel: "18 days in Scripture",
  accountId: "local-charles",
  authStatus: "Local profile",
  storageStatus: "Local only",
};
const savedProfile = {
  ...defaultProfile,
  ...readJson("brother.profile", {}),
};
const savedPreferences = {
  ...defaultPreferences,
  ...readJson("brother.preferences", {}),
};

const highlightColors = [
  { id: "gold", label: "Yellow", value: "rgba(255, 209, 102, 0.58)" },
  { id: "sage", label: "Green", value: "rgba(94, 225, 162, 0.52)" },
  { id: "sky", label: "Blue", value: "rgba(92, 200, 255, 0.54)" },
  { id: "violet", label: "Purple", value: "rgba(181, 140, 255, 0.54)" },
  { id: "rose", label: "Pink", value: "rgba(255, 120, 150, 0.52)" },
  { id: "orange", label: "Orange", value: "rgba(255, 155, 95, 0.56)" },
  { id: "charcoal", label: "Slate", value: "rgba(148, 163, 184, 0.48)" },
];

const greekInsights = {
  GAL: {
    5: {
      1: [
        { term: "eleutheria", gloss: "freedom, liberty", note: "Paul frames Christian freedom as release from bondage, not license for self-rule." },
        { term: "enecho", gloss: "to be held in, entangled", note: "The image is being trapped again under a constraining yoke." },
      ],
      5: [
        { term: "pneuma", gloss: "Spirit", note: "In Galatians 5, the Spirit is contrasted with flesh as the source of Christian life." },
      ],
      22: [
        { term: "karpos", gloss: "fruit", note: "Singular fruit points to the unified character produced by the Spirit." },
        { term: "agape", gloss: "love", note: "Self-giving covenant love heads the list of Spirit-formed virtues." },
      ],
    },
    6: {
      6: [
        { term: "katecheo", gloss: "to instruct, teach orally", note: "The one being taught is receiving formal instruction in the word, not merely casual advice." },
        { term: "logos", gloss: "word, message", note: "Here it points to the apostolic gospel instruction and Christian teaching received by the community." },
        { term: "koinoneo", gloss: "to share, participate, have fellowship", note: "Paul calls the taught believer to share materially with the teacher as an expression of fellowship." },
        { term: "agathos", gloss: "good, beneficial", note: "The phrase 'all good things' includes practical provision, not only spiritual encouragement." },
      ],
      7: [
        { term: "mukterizo", gloss: "to mock, turn up the nose", note: "The verb warns that God cannot be treated with contempt through self-deception." },
        { term: "speiro", gloss: "to sow", note: "Paul uses an agricultural image for moral and spiritual consequence." },
        { term: "therizo", gloss: "to reap, harvest", note: "The harvest corresponds to what is sown, forming the logic of the warning." },
      ],
    },
  },
  JHN: {
    15: {
      5: [
        { term: "ampelos", gloss: "vine", note: "Jesus identifies himself as the true source of covenant life and fruitfulness." },
        { term: "meno", gloss: "remain, abide", note: "A repeated Johannine verb for persevering communion with Christ." },
      ],
    },
  },
};

const compareVersions = {
  KJV: "King James Version",
};
const popularVersionOrder = ["KJV", "NKJV", "NLT", "CSB"];
const textSizeOptions = {
  xs: "13px",
  small: "15px",
  medium: "17px",
  large: "19px",
  xl: "21px",
};
const accentOptions = {
  bronze: { value: "#6b7f93", soft: "rgba(107, 127, 147, 0.16)", contrast: "#ffffff" },
  sage: { value: "#6f7d8a", soft: "rgba(111, 125, 138, 0.16)", contrast: "#171512" },
  pearl: { value: "#d9dfe6", soft: "rgba(217, 223, 230, 0.18)", contrast: "#1f1a13" },
  clay: { value: "#9aa6b2", soft: "rgba(154, 166, 178, 0.16)", contrast: "#ffffff" },
  charcoal: { value: "#4c4841", soft: "rgba(76, 72, 65, 0.16)", contrast: "#ffffff" },
  taupe: { value: "#6b7f93", soft: "rgba(107, 127, 147, 0.16)", contrast: "#ffffff" },
  "electric-blue": { value: "#6b7f93", soft: "rgba(107, 127, 147, 0.16)", contrast: "#ffffff" },
};

function normalizeAccentKey(accent) {
  if (accent === "electric-blue" || accent === "bronze") {
    return "taupe";
  }
  return accentOptions[accent] ? accent : defaultPreferences.accent;
}

const apologeticsTracksData = [
  {
    id: "islam",
    title: "Islam",
    icon: "shield",
    description: "Objections musulmanes fréquentes sur Jésus, la Bible et la crucifixion.",
    level: "Beginner",
    topics: [
      {
        id: "bible-corrupted",
        title: "La Bible a-t-elle été corrompue ?",
        category: "Bible",
        difficulty: "Essential",
        summary: "Répondre à l’idée que le texte biblique aurait été modifié au point d’être inutilisable.",
        opponentCase: [
          "Les Évangiles ont été changés au fil du temps.",
          "Le texte original de Jésus a disparu.",
          "Les manuscrits se contredisent trop pour être fiables.",
        ],
        shortAnswer: "Il n’existe pas de preuve historique d’une corruption totale de la Bible. Les manuscrits permettent au contraire de contrôler la transmission du texte de manière sérieuse.",
        keyResponse: [
          "Demande quand, où et par qui la corruption totale aurait eu lieu.",
          "Explique que la multitude de manuscrits rend une falsification universelle très difficile.",
          "Rappelle qu’une variation manuscrite ne signifie pas une doctrine perdue.",
        ],
        longAnswer: "La meilleure réponse n’est pas de nier les variantes manuscrites, mais de montrer qu’elles sont justement connues parce que les manuscrits ont été conservés. Une corruption totale demanderait un remplacement mondial coordonné sans trace historique crédible.",
        keyVerses: ["PSA.119.160", "MAT.5.18", "JHN.17.17"],
        questionsToAsk: [
          "Quel texte original aurait été remplacé exactement ?",
          "Qui a réussi à modifier tous les manuscrits dispersés dans plusieurs régions ?",
          "Pourquoi l’histoire ne garde-t-elle aucune trace claire d’une telle opération ?",
        ],
        pitfalls: [
          "Ne pas présenter l’argument comme s’il n’existait aucune variante mineure.",
          "Ne pas répondre avec mépris.",
          "Éviter de parler trop vite sans cadre historique.",
        ],
      },
      {
        id: "jesus-god",
        title: "Jésus est-il vraiment Dieu ?",
        category: "Jesus",
        difficulty: "Essential",
        summary: "Montrer que la divinité du Christ ne repose pas sur un seul verset isolé.",
        opponentCase: [
          "Jésus n’a jamais dit textuellement : Je suis Dieu, adorez-moi.",
          "Il priait Dieu, donc il ne peut pas être Dieu.",
          "Les chrétiens ont exagéré son statut plus tard.",
        ],
        shortAnswer: "Le Nouveau Testament présente Jésus avec les titres, les œuvres, l’autorité et l’honneur qui appartiennent à Dieu seul.",
        keyResponse: [
          "Montre le cumul des preuves plutôt qu’un slogan unique.",
          "Distingue la divinité du Fils et son incarnation réelle.",
          "Rappelle que Jésus reçoit l’adoration et pardonne les péchés.",
        ],
        longAnswer: "La question n’est pas seulement ce que Jésus a formulé avec nos catégories modernes, mais comment les auteurs bibliques l’identifient. Ils lui attribuent des fonctions et un honneur réservés à Dieu.",
        keyVerses: ["JHN.1.1", "JHN.8.58", "COL.2.9"],
        questionsToAsk: [
          "Qui peut pardonner les péchés en propre ?",
          "Pourquoi les Juifs ont-ils compris certaines paroles de Jésus comme un blasphème ?",
          "Pourquoi Thomas appelle-t-il Jésus mon Seigneur et mon Dieu ?",
        ],
        pitfalls: [
          "Ne pas nier la vraie humanité de Jésus.",
          "Éviter d’attaquer seulement avec Jean 1:1 sans expliquer le contexte.",
        ],
      },
      {
        id: "trinity-biblical",
        title: "La Trinité est-elle biblique ?",
        category: "Doctrine",
        difficulty: "Intermediate",
        summary: "Expliquer la Trinité sans tomber dans des analogies confuses.",
        opponentCase: [
          "Le mot Trinité n’est pas dans la Bible.",
          "Trois personnes = trois dieux.",
          "Cette doctrine serait une invention tardive.",
        ],
        shortAnswer: "Le mot n’est pas biblique, mais la doctrine résume fidèlement ce que l’Écriture affirme: un seul Dieu, et pourtant le Père, le Fils et l’Esprit sont distingués et pleinement divins.",
        keyResponse: [
          "Séparer clairement essence divine et distinction personnelle.",
          "Montrer que l’alternative n’est pas seulement entre Trinité et monothéisme pur abstrait.",
          "Utiliser plusieurs textes au lieu d’un seul.",
        ],
        longAnswer: "La Trinité n’est pas un ajout extérieur, mais une formulation théologique pour tenir ensemble toutes les données bibliques sans en supprimer une partie.",
        keyVerses: ["MAT.28.19", "2CO.13.14", "JHN.14.16-17"],
        questionsToAsk: [
          "Le Père est-il Dieu ? Le Fils est-il Dieu ? L’Esprit est-il Dieu ?",
          "Comment gardes-tu toutes ces affirmations ensemble sans en annuler une ?",
        ],
        pitfalls: [
          "Éviter les analogies eau/glace/vapeur.",
          "Ne pas expliquer la Trinité comme trois parties de Dieu.",
        ],
      },
      {
        id: "crucifixion-denied",
        title: "Jésus a-t-il été crucifié ?",
        category: "History",
        difficulty: "Essential",
        summary: "Répondre au refus de la crucifixion en s’appuyant sur l’histoire et le Nouveau Testament.",
        opponentCase: [
          "Dieu n’aurait jamais laissé son prophète mourir ainsi.",
          "Quelqu’un d’autre a été crucifié à sa place.",
          "Le récit chrétien est théologiquement construit.",
        ],
        shortAnswer: "La crucifixion de Jésus fait partie des faits les plus solidement établis de l’histoire ancienne chrétienne.",
        keyResponse: [
          "S’appuyer sur l’histoire avant d’entrer dans la théologie du salut.",
          "Montrer que même des sources non chrétiennes reconnaissent la crucifixion.",
          "Expliquer que la honte de la croix renforce l’authenticité du récit.",
        ],
        longAnswer: "Le problème n’est pas l’absence de sources, mais l’acceptation de ce qu’elles affirment. La croix est attestée très tôt, au cœur même de la proclamation chrétienne primitive.",
        keyVerses: ["1CO.15.3-4", "MAR.15.24", "ISA.53.5"],
        questionsToAsk: [
          "Pourquoi les premiers chrétiens auraient-ils inventé un Messie humilié par la croix ?",
          "Quelle source historique ancienne défend sérieusement la substitution d’une autre personne ?",
        ],
        pitfalls: [
          "Ne pas passer directement à l’expiation avant d’établir le fait historique.",
        ],
      },
    ],
  },
  {
    id: "jehovahs-witnesses",
    title: "Jehovah’s Witnesses",
    icon: "landmark",
    description: "Répondre aux textes souvent utilisés contre la divinité de Christ et la doctrine chrétienne.",
    level: "Beginner",
    topics: [
      {
        id: "john-1-1",
        title: "Jean 1:1 dit-il “un dieu” ?",
        category: "Bible",
        difficulty: "Essential",
        summary: "Répondre à la traduction qui minimise la divinité du Verbe.",
        opponentCase: [
          "Le grec permet de traduire theos par un dieu.",
          "Jésus est divin au sens secondaire, pas pleinement Dieu.",
        ],
        shortAnswer: "Jean 1:1 présente le Verbe comme distinct du Père, mais pleinement participant à l’identité divine, pas comme un petit dieu parmi d’autres.",
        keyResponse: [
          "Expliquer le rôle du contexte immédiat de Jean 1.",
          "Montrer que Jean parle de création universelle par le Verbe.",
          "Insister sur la cohérence du prologue entier.",
        ],
        longAnswer: "La traduction isolée d’un mot ne suffit pas. Le prologue attribue au Verbe des fonctions et une éternité incompatibles avec l’idée d’une simple créature divine inférieure.",
        keyVerses: ["JHN.1.1", "JHN.1.3", "JHN.1.18"],
        questionsToAsk: [
          "Si tout a été fait par le Verbe, dans quelle catégorie mettez-vous le Verbe lui-même ?",
          "Pourquoi Jean commence-t-il comme Genèse 1 s’il veut seulement parler d’une créature élevée ?",
        ],
        pitfalls: [
          "Ne pas réduire la discussion à une seule règle grammaticale compliquée.",
        ],
      },
      {
        id: "jesus-created",
        title: "Jésus est-il la première créature ?",
        category: "Jesus",
        difficulty: "Essential",
        summary: "Répondre à l’idée que le Fils serait la première œuvre de Dieu.",
        opponentCase: [
          "Colossiens parle du premier-né de toute création.",
          "Proverbes 8 serait Jésus créé avant le monde.",
        ],
        shortAnswer: "Premier-né ne signifie pas forcément premier créé; le terme peut exprimer rang, héritage et suprématie.",
        keyResponse: [
          "Lire Colossiens 1 jusqu’au bout, pas seulement l’expression isolée.",
          "Montrer que Christ est au-dessus de toute création.",
          "Refuser l’équation automatique premier-né = première créature.",
        ],
        longAnswer: "Dans Colossiens, Paul ne présente pas le Christ comme appartenant au monde créé, mais comme celui par qui et pour qui tout existe.",
        keyVerses: ["COL.1.15-17", "HEB.1.2-3", "MIC.5.2"],
        questionsToAsk: [
          "Pourquoi Paul dit-il que tout subsiste en lui ?",
          "Si Christ fait partie des choses créées, comment peut-il être l’agent de toute création sans exception ?",
        ],
        pitfalls: [
          "Éviter de répondre uniquement par slogans anti-sectes.",
        ],
      },
      {
        id: "cross-or-stake",
        title: "Croix ou poteau ?",
        category: "History",
        difficulty: "Beginner",
        summary: "Répondre sans faire de la forme exacte de l’instrument le centre du débat.",
        opponentCase: [
          "Le mot grec veut juste dire poteau.",
          "Le symbole de la croix serait païen.",
        ],
        shortAnswer: "Le point central n’est pas la vénération d’un symbole, mais le fait historique de la mort rédemptrice du Christ.",
        keyResponse: [
          "Ne pas se laisser détourner du sujet principal.",
          "Montrer que l’histoire romaine connaissait diverses formes de crucifixion.",
          "Recentrer sur l’œuvre de Christ.",
        ],
        longAnswer: "Même si le débat lexical existe, le Nouveau Testament insiste surtout sur la signification salvifique de la crucifixion.",
        keyVerses: ["GAL.6.14", "1CO.1.18", "PHI.2.8"],
        questionsToAsk: [
          "Pourquoi cette question de forme devient-elle plus importante que l’identité de Christ ?",
        ],
        pitfalls: [
          "Ne pas donner l’impression que les chrétiens adorent la croix matérielle.",
        ],
      },
      {
        id: "michael-archangel",
        title: "Jésus est-il Michel l’archange ?",
        category: "Jesus",
        difficulty: "Intermediate",
        summary: "Montrer que le Fils est présenté comme supérieur aux anges, non comme l’un d’eux.",
        opponentCase: [
          "Michel commande les anges, comme Jésus.",
          "1 Thessaloniciens 4 mentionne une voix d’archange.",
        ],
        shortAnswer: "Le Nouveau Testament place le Fils au-dessus du monde angélique et lui attribue un statut que les anges ne reçoivent jamais.",
        keyResponse: [
          "Utiliser Hébreux 1 comme texte majeur.",
          "Montrer la différence entre venir avec une voix d’archange et être un archange.",
        ],
        longAnswer: "Le cœur de la réponse est la supériorité du Fils dans Hébreux: adoré par les anges, créateur, roi éternel.",
        keyVerses: ["HEB.1.4-8", "HEB.1.13", "1TH.4.16"],
        questionsToAsk: [
          "Quel ange reçoit l’adoration des anges ?",
          "Pourquoi Hébreux prend-il tant de soin à distinguer le Fils des anges ?",
        ],
        pitfalls: [
          "Ne pas négliger le contexte complet de Hébreux 1.",
        ],
      },
    ],
  },
  {
    id: "atheism",
    title: "Atheism",
    icon: "atom",
    description: "Objections sur le mal, la science, la résurrection et la fiabilité de la foi chrétienne.",
    level: "Beginner",
    topics: [
      {
        id: "problem-of-evil",
        title: "Pourquoi Dieu permet-il le mal ?",
        category: "Suffering",
        difficulty: "Essential",
        summary: "Répondre à l’objection émotionnelle et philosophique sans froideur.",
        opponentCase: [
          "Un Dieu bon et tout-puissant éliminerait le mal.",
          "La souffrance innocente contredit l’existence de Dieu.",
        ],
        shortAnswer: "Le christianisme ne banalise pas le mal; il affirme que Dieu le juge réellement, qu’il est entré lui-même dans la souffrance, et qu’il promet sa défaite finale.",
        keyResponse: [
          "Distinguer problème logique et problème existentiel.",
          "Montrer que l’Évangile donne une réponse incarnée, pas abstraite.",
          "Insister sur la croix et l’espérance finale.",
        ],
        longAnswer: "Le christianisme ne prétend pas que tout soit facile à expliquer maintenant, mais il offre une vision où le mal n’est ni nié, ni absolu, ni victorieux.",
        keyVerses: ["ROM.8.18", "REV.21.4", "HEB.4.15"],
        questionsToAsk: [
          "Sur quelle base objective appelez-vous une chose réellement mauvaise ?",
          "Pourquoi l’indignation morale humaine compte-t-elle autant si l’univers est moralement neutre ?",
        ],
        pitfalls: [
          "Ne pas répondre de manière froide à une souffrance personnelle.",
          "Éviter les clichés simplistes.",
        ],
      },
      {
        id: "science-vs-god",
        title: "La science a-t-elle rendu Dieu inutile ?",
        category: "Science",
        difficulty: "Beginner",
        summary: "Montrer que science et existence de Dieu n’opèrent pas sur le même niveau d’explication.",
        opponentCase: [
          "La science explique de plus en plus l’univers.",
          "Dieu n’est qu’un bouche-trou pour ce qu’on ignore encore.",
        ],
        shortAnswer: "La science explique beaucoup de mécanismes, mais elle ne remplace pas les questions de fond sur l’origine, l’ordre, l’intelligibilité et la raison même de l’existence.",
        keyResponse: [
          "Refuser le faux dilemme science ou Dieu.",
          "Distinguer causes physiques et fondement ultime.",
          "Montrer que l’intelligibilité du monde est elle-même remarquable.",
        ],
        longAnswer: "Le chrétien n’invoque pas Dieu pour combler chaque ignorance ponctuelle; il affirme que le monde entier dépend ultimement de Dieu, y compris ses lois régulières.",
        keyVerses: ["COL.1.16-17", "PSA.19.1", "ROM.1.20"],
        questionsToAsk: [
          "Pourquoi y a-t-il quelque chose plutôt que rien ?",
          "Pourquoi l’univers est-il intelligible et mathématiquement ordonné ?",
        ],
        pitfalls: [
          "Éviter les pseudo-arguments scientifiques mal maîtrisés.",
        ],
      },
      {
        id: "resurrection-credible",
        title: "La résurrection de Jésus est-elle crédible ?",
        category: "History",
        difficulty: "Essential",
        summary: "Ancrer la foi chrétienne dans un événement historique revendiqué publiquement.",
        opponentCase: [
          "Les miracles sont impossibles.",
          "Les disciples ont inventé l’histoire.",
          "Les témoins ont eu des hallucinations.",
        ],
        shortAnswer: "La résurrection n’est pas un mythe isolé hors du temps; elle est annoncée très tôt, au centre de la foi apostolique, avec des témoins identifiables.",
        keyResponse: [
          "Établir d’abord les faits minimaux reconnus.",
          "Montrer la transformation des disciples.",
          "Comparer les hypothèses concurrentes.",
        ],
        longAnswer: "Le christianisme repose sur une proclamation publique d’un tombeau vide, d’apparitions et d’une conviction apostolique précoce. La question honnête est: quelle hypothèse explique le mieux l’ensemble ?",
        keyVerses: ["1CO.15.3-8", "LUK.24.36-43", "ACT.2.32"],
        questionsToAsk: [
          "Quelle hypothèse naturelle explique le mieux tous les éléments ensemble ?",
          "Pourquoi la résurrection est-elle proclamée si tôt à Jérusalem même ?",
        ],
        pitfalls: [
          "Ne pas parler de la résurrection seulement comme d’une expérience intérieure.",
        ],
      },
      {
        id: "bible-contradictions",
        title: "La Bible est-elle pleine de contradictions ?",
        category: "Bible",
        difficulty: "Essential",
        summary: "Répondre sans nier les difficultés réelles du texte biblique.",
        opponentCase: [
          "Les récits ne disent pas exactement la même chose.",
          "Des détails historiques paraissent divergents.",
        ],
        shortAnswer: "Il existe des passages difficiles, mais la présence de variations ou d’angles différents ne prouve pas automatiquement une contradiction destructrice.",
        keyResponse: [
          "Reconnaître honnêtement les textes difficiles.",
          "Distinguer contradiction réelle et différence de perspective.",
          "Rappeler la cohérence globale du message biblique.",
        ],
        longAnswer: "Une contradiction exige que deux affirmations incompatibles portent sur le même point dans le même sens. Beaucoup d’objections confondent sélection narrative, compression, ou focalisation différente avec contradiction.",
        keyVerses: ["LUK.1.1-4", "2TI.3.16", "PSA.12.6"],
        questionsToAsk: [
          "En quoi les deux textes sont-ils logiquement impossibles à harmoniser ?",
          "Est-ce une contradiction ou simplement un angle narratif distinct ?",
        ],
        pitfalls: [
          "Éviter les harmonisations artificielles trop rapides.",
        ],
      },
    ],
  },
];

const apologeticsState = {
  trackId: localStorage.getItem("brother.apologetics.track") || apologeticsTracksData[0].id,
  category: localStorage.getItem("brother.apologetics.category") || "all",
  topicId: localStorage.getItem("brother.apologetics.topic") || apologeticsTracksData[0].topics[0].id,
  selectedTrackTopicId: localStorage.getItem("brother.apologetics.selectedTrackTopic") || "",
};
const apologeticsProgressState = readJson(apologeticsProgressKey, {
  visitedTopicIds: [],
  completedTopicIds: [],
  lastActiveDate: "",
  streak: 0,
});
const apologeticsChatState = {
  activeTab: "muslim",
  activeTopicView: "introduction",
  conversations: readJson(apologeticsChatKey, {}),
  pendingKeys: {},
};
const savedApologeticsOverview = readJson("brother.apologeticsOverview", {});
const apologeticsOverviewState = {
  featuredOpenTrackId: savedApologeticsOverview.featuredOpenTrackId || "",
  trackFrameworkOpen: savedApologeticsOverview.trackFrameworkOpen || {},
};
let apologeticsChatRequestId = 0;

const newTestamentStartIndex = BOOKS.findIndex((book) => book.id === "MAT");

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  if (key === "brother.notes") {
    markPendingSync(key);
    return;
  }
  syncStateKey(key, value);
}

function setLocalValue(key, value) {
  localStorage.setItem(key, value);
  syncStateKey(key, value);
}

function removeLocalValue(key) {
  localStorage.removeItem(key);
  if (supabaseClient && supabaseUser && !isHydratingSupabase) {
    supabaseClient.from("user_app_state").delete().eq("user_id", supabaseUser.id).eq("state_key", key);
  }
}

function parseStoredValue(rawValue) {
  try {
    return JSON.parse(rawValue);
  } catch {
    return rawValue;
  }
}

function encodeLocalPayload(rawValue) {
  const raw = String(rawValue ?? "");
  try {
    return { __localState: true, raw: false, value: JSON.parse(raw) };
  } catch {
    return { __localState: true, raw: true, value: raw };
  }
}

function decodeRemotePayload(payload) {
  if (payload && payload.__localState === true) {
    return payload.raw ? String(payload.value ?? "") : JSON.stringify(payload.value);
  }
  return typeof payload === "string" ? payload : JSON.stringify(payload);
}

function getPendingSyncKeys() {
  return new Set(readJson(pendingSyncKey, []));
}

function markPendingSync(key) {
  const pendingKeys = getPendingSyncKeys();
  pendingKeys.add(key);
  localStorage.setItem(pendingSyncKey, JSON.stringify([...pendingKeys]));
}

function clearPendingSync(key) {
  const pendingKeys = getPendingSyncKeys();
  pendingKeys.delete(key);
  if (pendingKeys.size) {
    localStorage.setItem(pendingSyncKey, JSON.stringify([...pendingKeys]));
  } else {
    localStorage.removeItem(pendingSyncKey);
  }
}

async function syncStateKey(key, value) {
  if (key === "brother.prayerRequests" || !supabaseClient || !supabaseUser || isHydratingSupabase || !key.startsWith("brother.")) {
    return;
  }

  const { error } = await supabaseClient.from("user_app_state").upsert({
    user_id: supabaseUser.id,
    state_key: key,
    payload: encodeLocalPayload(typeof value === "string" ? value : JSON.stringify(value)),
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,state_key" });

  if (error) {
    console.warn("Supabase state sync failed:", error.message);
    return false;
  }
  clearPendingSync(key);
  return true;
}

let pendingSyncPromise = null;

async function syncPendingState() {
  if (!supabaseClient || !supabaseUser || isHydratingSupabase || !getPendingSyncKeys().size) {
    return;
  }
  if (pendingSyncPromise) {
    return pendingSyncPromise;
  }

  pendingSyncPromise = (async () => {
    const pendingKeys = [...getPendingSyncKeys()];
    for (const key of pendingKeys) {
      if (key === "brother.notes") {
        await syncStateKey(key, readJson(key, {}));
      }
    }
  })().finally(() => {
    pendingSyncPromise = null;
  });

  return pendingSyncPromise;
}

function setAuthFeedback(message, isError = false) {
  profileAuthBridgeFeedback = message;
  if (!authFeedback) {
    document.dispatchEvent(new CustomEvent("profile:auth-change"));
    return;
  }
  authFeedback.textContent = message;
  authFeedback.dataset.state = isError ? "error" : "success";
  document.dispatchEvent(new CustomEvent("profile:auth-change"));
}

function updateAuthUi() {
  const connected = Boolean(supabaseUser);
  const authEmailInput = authForm?.elements.email;
  const authPasswordField = authForm?.elements.password?.closest(".auth-password-field");
  if (authModeLabel) {
    authModeLabel.textContent = connected ? "Connected" : "Not connected";
  }
  if (authEmailInput) authEmailInput.hidden = connected;
  if (authPasswordField) authPasswordField.hidden = connected;
  if (authConnectedEmail) authConnectedEmail.hidden = !connected;
  if (authConnectedEmailValue) authConnectedEmailValue.textContent = connected ? (supabaseUser.email || "") : "";
  if (authSignInButton) authSignInButton.hidden = connected;
  if (authSignUpButton) authSignUpButton.hidden = connected;
  if (authSignOutButton) authSignOutButton.hidden = !connected;
  if (profileAuthStatus) profileAuthStatus.textContent = connected ? "Supabase account" : "Local profile";
  if (profileStorageStatus) profileStorageStatus.textContent = connected ? "Synced" : "Local only";
  if (profileAccountId && connected) profileAccountId.textContent = supabaseUser.id;
  document.dispatchEvent(new CustomEvent("profile:auth-change"));
}

async function hydrateSupabaseState() {
  if (!supabaseClient || !supabaseUser) {
    return false;
  }

  isHydratingSupabase = true;
  try {
    const { data: rows, error } = await supabaseClient
      .from("user_app_state")
      .select("state_key,payload")
      .eq("user_id", supabaseUser.id);

    if (error) {
      throw error;
    }

    const localKeys = Object.keys(localStorage).filter((key) => key.startsWith("brother."));
    const localRows = new Map(localKeys.map((key) => [key, localStorage.getItem(key)]));
    const remoteRows = new Map((rows || []).map((row) => [row.state_key, row.payload]));
    const missingRows = [];

    const pendingKeys = getPendingSyncKeys();
    remoteRows.forEach((payload, key) => {
      if (!pendingKeys.has(key)) {
        localStorage.setItem(key, decodeRemotePayload(payload));
      }
    });

    localRows.forEach((payload, key) => {
      if (!remoteRows.has(key)) {
        missingRows.push({ user_id: supabaseUser.id, state_key: key, payload: encodeLocalPayload(payload) });
      }
    });

    if (missingRows.length) {
      const { error: uploadError } = await supabaseClient
        .from("user_app_state")
        .upsert(missingRows, { onConflict: "user_id,state_key" });
      if (uploadError) throw uploadError;
    }

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("id,email,display_name,country,age,avatar_url,bio,streak")
      .eq("id", supabaseUser.id)
      .maybeSingle();
    if (profile) {
      const localProfile = readJson("brother.profile", {});
      writeLocalWithoutSync("brother.profile", {
        ...localProfile,
        email: profile.email || supabaseUser.email || "",
        displayName: profile.display_name || localProfile.displayName || "Charles",
        country: profile.country || localProfile.country || "",
        dateOfBirth: localProfile.dateOfBirth || "",
        avatarInitials: localProfile.avatarInitials || getProfileInitials(profile.display_name),
        bio: profile.bio || localProfile.bio || "",
        accountId: profile.id,
        authStatus: "Supabase account",
        storageStatus: "Synced",
      });
    }

    const { data: preferences } = await supabaseClient
      .from("user_preferences")
      .select("app_background,text_size,accent")
      .eq("user_id", supabaseUser.id)
      .maybeSingle();
    if (preferences) {
      writeLocalWithoutSync("brother.preferences", {
        background: preferences.app_background || "paper",
        textSize: preferences.text_size || "medium",
        accent: preferences.accent || "taupe",
      });
    }

    return true;
  } finally {
    isHydratingSupabase = false;
  }
}

function writeLocalWithoutSync(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

async function handleSupabaseSession(session) {
  supabaseUser = session?.user || null;
  updateAuthUi();
  refreshHomeLibraryPanel();
  if (!supabaseUser) {
    await loadPrayerFromSupabase();
    return;
  }

  try {
    await syncPendingState();
    const hydrated = await hydrateSupabaseState();
    await loadPrayerFromSupabase();
    refreshHomeLibraryPanel();
    const marker = sessionStorage.getItem("brother.supabaseHydratedUser");
    if (hydrated && marker !== supabaseUser.id) {
      sessionStorage.setItem("brother.supabaseHydratedUser", supabaseUser.id);
      window.location.reload();
    }
  } catch (error) {
    setAuthFeedback(`Sync failed: ${error.message}`, true);
  }
}

async function initSupabase() {
  if (!window.supabase?.createClient) {
    setAuthFeedback("Supabase client could not be loaded.", true);
    return;
  }

  try {
    const response = await fetch("/api/supabase/config");
    const config = await response.json();
    if (!config.configured) {
      updateAuthUi();
      return;
    }

    supabaseClient = window.supabase.createClient(config.url, config.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    supabaseClient.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => handleSupabaseSession(session), 0);
    });
    const { data } = await supabaseClient.auth.getSession();
    await handleSupabaseSession(data.session);
  } catch (error) {
    setAuthFeedback(`Supabase unavailable: ${error.message}`, true);
  }
}

function initAuthForm() {
  if (!authForm || !window.supabase) {
    return;
  }

  let authMode = "sign-in";
  const passwordConfirm = authForm.elements.passwordConfirm;

  const setAuthMode = (mode) => {
    authMode = mode;
    const isSignUp = mode === "sign-up";
    authSignInButton.type = isSignUp ? "button" : "submit";
    authSignUpButton.type = isSignUp ? "submit" : "button";
    authSignInButton.classList.toggle("is-secondary", isSignUp);
    authSignUpButton.classList.toggle("is-primary", isSignUp);
    passwordConfirm.closest(".auth-password-field").hidden = !isSignUp;
    if (!isSignUp) {
      passwordConfirm.value = "";
    }
    setAuthFeedback(isSignUp ? "Create your account with an email and password." : "Sign in to sync your data.");
  };

  setAuthMode("sign-in");

  passwordToggleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const input = authForm.elements[button.dataset.passwordToggle];
      const isVisible = input.type === "text";
      input.type = isVisible ? "password" : "text";
      button.setAttribute("aria-label", `${isVisible ? "Show" : "Hide"} password${input.name === "passwordConfirm" ? " confirmation" : ""}`);
      button.innerHTML = `<i data-lucide="${isVisible ? "eye" : "eye-off"}"></i>`;
      refreshIcons();
    });
  });

  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!supabaseClient) {
      setAuthFeedback("Supabase is not configured yet.", true);
      return;
    }
    const email = authForm.elements.email.value.trim();
    const password = authForm.elements.password.value;
    if (authMode === "sign-up") {
      if (!passwordConfirm.value) {
        setAuthFeedback("Confirm your password to create the account.", true);
        passwordConfirm.focus();
        return;
      }
      if (password !== passwordConfirm.value) {
        setAuthFeedback("Passwords do not match.", true);
        passwordConfirm.focus();
        return;
      }
      const { error } = await supabaseClient.auth.signUp({ email, password });
      setAuthFeedback(error ? error.message : "Account created. Check your email if confirmation is enabled.", Boolean(error));
      return;
    }

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    setAuthFeedback(error ? error.message : "Signed in. Syncing your data...");
  });

  authSignInButton?.addEventListener("click", (event) => {
    if (authMode === "sign-up") {
      event.preventDefault();
      setAuthMode("sign-in");
    }
  });

  authSignUpButton?.addEventListener("click", () => {
    if (!supabaseClient) {
      setAuthFeedback("Supabase is not configured yet.", true);
      return;
    }
    if (authMode !== "sign-up") {
      setAuthMode("sign-up");
      passwordConfirm.focus();
    }
  });

  authForgotButton?.addEventListener("click", async () => {
    if (!supabaseClient) {
      setAuthFeedback("Supabase is not configured yet.", true);
      return;
    }
    const email = authForm.elements.email.value.trim();
    if (!email) {
      authForm.elements.email.focus();
      setAuthFeedback("Enter your email first to reset your password.", true);
      return;
    }
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${window.location.pathname}`,
    });
    setAuthFeedback(error ? error.message : "Password reset email sent. Check your inbox.", Boolean(error));
  });

  authSignOutButton?.addEventListener("click", async () => {
    await supabaseClient?.auth.signOut();
    sessionStorage.removeItem("brother.supabaseHydratedUser");
    setAuthFeedback("Signed out. The app is now local-only.");
  });
}

function getTodayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function animatePeopleOnline(nextValue) {
  if (!peopleOnline) return;
  const startValue = peopleOnlineValue;
  const startedAt = performance.now();
  const duration = 1700;

  window.cancelAnimationFrame(peopleOnlineAnimationFrame);
  const step = (now) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - ((1 - progress) ** 3);
    peopleOnline.textContent = String(Math.round(startValue + ((nextValue - startValue) * eased)));
    emitHomeStatsChange();
    if (progress < 1) {
      peopleOnlineAnimationFrame = window.requestAnimationFrame(step);
    } else {
      peopleOnlineValue = nextValue;
    }
  };
  peopleOnlineAnimationFrame = window.requestAnimationFrame(step);
}

function emitHomeStatsChange() {
  if (homeStatsEmitTimer) return;
  homeStatsEmitTimer = window.setTimeout(() => {
    homeStatsEmitTimer = null;
    window.dispatchEvent(new CustomEvent("home:stats-change", {
      detail: {
        streak: homeStreak?.textContent?.trim() || "1 day",
        peopleOnline: peopleOnline?.textContent?.trim() || String(peopleOnlineValue),
        continueReading: homeContinueReading?.textContent?.trim() || "John 15",
        prayerCount: homePrayerCount?.textContent?.trim() || "0",
      },
    }));
  }, 80);
}

function updatePeopleOnline() {
  if (!peopleOnline) return;
  const hour = new Date().getHours();
  const targetByHour = hour < 7
    ? 135
    : hour < 11
      ? 210
      : hour < 17
        ? 310
        : hour < 20
          ? 430
          : hour < 22
            ? 525
            : 600;
  const step = Math.floor(Math.random() * 3) + 3;
  let direction = Math.random() > 0.5 ? 1 : -1;

  if (peopleOnlineValue < targetByHour - 8) direction = 1;
  if (peopleOnlineValue > targetByHour + 8) direction = -1;

  const nextValue = Math.max(100, Math.min(640, peopleOnlineValue + (step * direction)));
  animatePeopleOnline(nextValue);
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

  if (peopleOnline) {
    peopleOnlineValue = Number(peopleOnline.textContent) || peopleOnlineValue;
    peopleOnline.textContent = String(peopleOnlineValue);
    if (!peopleOnlineInterval) {
      peopleOnlineInterval = window.setInterval(updatePeopleOnline, 2000);
    }
  }
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

function countPrayerWords(value) {
  return String(value || "").trim() ? String(value).trim().split(/\s+/).length : 0;
}

function getPrayerModerationMessage(text) {
  const links = String(text || "").match(/https?:\/\/\S+/gi) || [];
  if (links.length > 1) return "Please remove extra links from your request.";
  if (/(.)\1{9,}/.test(String(text || ""))) return "Please check your request and remove repeated characters.";
  return "";
}

function getPrayerStatus(request) {
  return request.status === "answered" ? "answered" : "active";
}

function getPrayerPreview(text, wordLimit = 6) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  return words.length > wordLimit ? `${words.slice(0, wordLimit).join(" ")}...` : words.join(" ");
}

const prayerPrompts = [
  "What would you like us to pray for?",
  "What is on your heart today?",
  "How can the community pray with you?",
];
let prayerPromptIndex = 0;
let prayerPromptTimer = null;
let prayerPromptFadeTimer = null;

function stopPrayerPromptRotation() {
  window.clearInterval(prayerPromptTimer);
  window.clearTimeout(prayerPromptFadeTimer);
  prayerPromptTimer = null;
  prayerPromptFadeTimer = null;
  prayerRequestInput?.classList.remove("is-placeholder-fading");
}

function startPrayerPromptRotation() {
  if (!prayerRequestInput || prayerRequestInput.value.trim()) return;
  stopPrayerPromptRotation();
  prayerRequestInput.placeholder = prayerPrompts[prayerPromptIndex];
  prayerPromptTimer = window.setInterval(() => {
    if (prayerRequestInput.value.trim()) {
      stopPrayerPromptRotation();
      return;
    }
    prayerRequestInput.classList.add("is-placeholder-fading");
    prayerPromptFadeTimer = window.setTimeout(() => {
      prayerPromptIndex = (prayerPromptIndex + 1) % prayerPrompts.length;
      prayerRequestInput.placeholder = prayerPrompts[prayerPromptIndex];
      prayerRequestInput.classList.remove("is-placeholder-fading");
    }, 260);
  }, 2200);
}

function setPrayerCategory(value) {
  if (prayerCategory) prayerCategory.value = value;
  prayerCategoryOptions.forEach((option) => {
    option.classList.toggle("is-active", option.dataset.prayerCategoryOption === value);
  });
  prayerCategoryOptions
    .find((option) => option.dataset.prayerCategoryOption === value)
    ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
}

function showPrayerSentState() {
  if (!prayerSubmitButton || !prayerSubmitLabel) return;
  window.clearTimeout(prayerSubmitResetTimer);
  prayerSubmitButton.classList.add("is-sent");
  prayerSubmitLabel.textContent = "Sent";
  prayerSubmitResetTimer = window.setTimeout(() => {
    prayerSubmitButton.classList.remove("is-sent");
    prayerSubmitLabel.textContent = "Send prayer request";
  }, 1800);
}

function savePrayerRequests() {
  writeJson("brother.prayerRequests", prayerState.requests);
  updateHomePrayerCount();
}

async function loadPrayerFromSupabase() {
  if (!supabaseClient) {
    return;
  }

  if (!supabaseUser) {
    prayerState.requests = [];
    renderPrayerPage();
    return;
  }

  const { data: requests, error } = await supabaseClient
    .from("prayer_requests")
    .select("id,author_id,content,prayer_count,status,category,urgent,created_at");
  if (error) {
    console.warn("Prayer requests could not be loaded:", error.message);
    return;
  }
  updateHomePrayerCount();

  if (!requests?.length) {
    renderPrayerPage();
    return;
  }

  const { data: ownInteractions = [] } = await supabaseClient
    .from("prayer_interactions")
    .select("request_id")
    .eq("user_id", supabaseUser.id);
  const prayedIds = new Set(ownInteractions.map((item) => item.request_id));
  prayerState.requests = (requests || []).map((request) => ({
    id: request.id,
    ownerId: request.author_id,
    text: request.content,
    prayerCount: request.prayer_count || 0,
    prayedBy: prayedIds.has(request.id) && supabaseUser ? [supabaseUser.id] : [],
    createdAt: request.created_at,
    status: request.status || "active",
    category: request.category || "general",
    urgent: Boolean(request.urgent),
  }));
  renderPrayerPage();
}

async function createPrayerRequest(text, category, urgent, backgroundIndex) {
  if (!supabaseClient || !supabaseUser) {
    return false;
  }
  const { data, error } = await supabaseClient.from("prayer_requests").insert({
    author_id: supabaseUser.id,
    content: text,
    category,
    urgent,
  }).select("id").single();
  if (error) {
    prayerFeedback.textContent = error.message;
    return false;
  }
  if (data?.id) {
    prayerBackgroundAssignments[data.id] = backgroundIndex;
    writeJson("brother.prayerBackgrounds", prayerBackgroundAssignments);
  }
  await loadPrayerFromSupabase();
  return true;
}

function renderPrayerPage() {
  if (!prayerList) {
    return;
  }

  if (prayerRequestPanel) prayerRequestPanel.hidden = prayerState.pageTab !== "request";
  prayerList.hidden = false;
  const isMyWall = prayerState.pageTab === "request";
  if (prayerBoardLabel) prayerBoardLabel.textContent = isMyWall ? "MyPrayers Wall" : "Prayer board";
  if (prayerBoardContent) prayerBoardContent.hidden = isMyWall && !prayerState.myWallExpanded;
  if (prayerBoardToggle) {
    prayerBoardToggle.setAttribute("aria-expanded", String(!isMyWall || prayerState.myWallExpanded));
    prayerBoardToggle.classList.toggle("is-collapsed", isMyWall && !prayerState.myWallExpanded);
  }
  document.querySelectorAll("[data-prayer-page-tab]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.prayerPageTab === prayerState.pageTab);
  });

  const requests = prayerState.requests
    .filter((request) => {
      if (prayerState.pageTab === "request") {
        const isOwnRequest = supabaseClient
          ? request.ownerId === supabaseUser?.id
          : true;
        if (!isOwnRequest) return false;
      }
      if (prayerState.pageTab === "board") {
        return prayerState.filter === "all" || (request.category || "general") === prayerState.filter;
      }
      return true;
    })
    .sort((a, b) => {
      if (prayerState.filter === "recent" || prayerState.sort === "recent") {
        return String(b.createdAt).localeCompare(String(a.createdAt));
      }
      const difference = prayerState.sort === "least"
        ? a.prayerCount - b.prayerCount
        : b.prayerCount - a.prayerCount;
      return difference || String(b.createdAt).localeCompare(String(a.createdAt));
    });

  const emptyMessage = prayerState.pageTab === "request"
    ? "You have not posted any prayer requests yet."
    : "No prayer requests have been posted yet.";
  prayerList.innerHTML = requests.length
    ? requests.map((request) => {
        const currentPrayerUserId = supabaseUser?.id || prayerUserId;
        const hasPrayed = request.prayedBy?.includes(currentPrayerUserId);
        const isNewlyPrayed = hasPrayed && request.prayerCount === 1;
        const expanded = Boolean(request.expanded);
        const prayerBackgroundIndex = getPrayerBackgroundIndex(request);
        return `
          <article class="prayer-card${expanded ? " is-expanded" : ""}${request.urgent ? " is-urgent" : ""}${isNewlyPrayed ? " is-prayed" : ""}" style="--prayer-card-image: url('assets/prayer-backgrounds/prayer-${prayerBackgroundIndex + 1}.jpg')">
            <button type="button" class="prayer-card-toggle" data-prayer-toggle data-prayer-id="${escapeAttr(request.id)}" aria-expanded="${expanded}">
              <span>
                <p>${escapeHtml(expanded ? request.text : getPrayerPreview(request.text))}</p>
              </span>
              <i data-lucide="chevron-down"></i>
            </button>
            <div class="prayer-card-meta">
              <div class="prayer-card-actions">
                <button type="button" class="prayer-action prayer-action-secondary" data-prayer-action="share" data-prayer-id="${escapeAttr(request.id)}" aria-label="Share prayer request" title="Share"><i data-lucide="share-2"></i></button>
                <button type="button" class="prayer-action${hasPrayed ? " is-prayed" : ""}" data-prayer-action="pray" data-prayer-id="${escapeAttr(request.id)}" aria-label="${hasPrayed ? "Prayer count" : "I prayed"}">
                  <i data-lucide="${hasPrayed ? "heart" : "hand-heart"}"></i>
                  <span>${request.prayerCount}</span>
                </button>
              </div>
            </div>
          </article>
        `;
      }).join("")
    : `<p class="prayer-empty">${emptyMessage}</p>`;
  const sortSelect = document.querySelector("[data-prayer-sort]");
  if (sortSelect) {
    sortSelect.value = prayerState.sort;
  }
  document.querySelectorAll("[data-prayer-filter]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.prayerFilter === prayerState.filter);
  });
  refreshIcons();
  emitPrayerStateChange();
}

function emitPrayerStateChange() {
  document.dispatchEvent(new CustomEvent("prayer:state-change"));
}

function setPrayerBridgeFeedback(message) {
  prayerBridgeFeedback = message;
  if (prayerFeedback) prayerFeedback.textContent = message;
  emitPrayerStateChange();
}

function normalizeApologeticsProgress() {
  apologeticsProgressState.visitedTopicIds = [...new Set(apologeticsProgressState.visitedTopicIds || [])];
  apologeticsProgressState.completedTopicIds = [...new Set(apologeticsProgressState.completedTopicIds || [])];
  apologeticsProgressState.lastActiveDate = apologeticsProgressState.lastActiveDate || "";
  apologeticsProgressState.streak = Number(apologeticsProgressState.streak || 0);
}

function saveApologeticsProgress() {
  normalizeApologeticsProgress();
  writeJson(apologeticsProgressKey, apologeticsProgressState);
}

function saveApologeticsOverview() {
  writeJson("brother.apologeticsOverview", apologeticsOverviewState);
}

function touchApologeticsProgress() {
  normalizeApologeticsProgress();
  const todayKey = getTodayKey();
  if (apologeticsProgressState.lastActiveDate === todayKey) {
    return;
  }

  const previous = apologeticsProgressState.lastActiveDate ? new Date(`${apologeticsProgressState.lastActiveDate}T00:00:00`) : null;
  const today = new Date(`${todayKey}T00:00:00`);
  const dayDiff = previous ? Math.round((today - previous) / 86400000) : null;
  apologeticsProgressState.streak = dayDiff === 1
    ? Math.max(1, apologeticsProgressState.streak + 1)
    : 1;
  apologeticsProgressState.lastActiveDate = todayKey;
  saveApologeticsProgress();
}

function markApologeticsTopicVisited(topicId) {
  if (!topicId || apologeticsProgressState.visitedTopicIds.includes(topicId)) {
    return;
  }
  apologeticsProgressState.visitedTopicIds.push(topicId);
  saveApologeticsProgress();
}

function markApologeticsTopicCompleted(topicId) {
  if (!topicId || apologeticsProgressState.completedTopicIds.includes(topicId)) {
    return;
  }
  markApologeticsTopicVisited(topicId);
  apologeticsProgressState.completedTopicIds.push(topicId);
  saveApologeticsProgress();
}

function getRecentAiMemory() {
  const cutoff = Date.now() - aiMemoryTtlMs;
  const memory = readJson(aiMemoryKey, [])
    .filter((item) => item && item.createdAt >= cutoff && ["user", "assistant"].includes(item.role) && item.text)
    .slice(-maxAiMemoryMessages);
  writeJson(aiMemoryKey, memory);
  return memory;
}

function rememberAiMessage(role, text) {
  const cleanText = String(text || "").trim();
  if (!cleanText || !["user", "assistant"].includes(role)) {
    return;
  }

  const memory = getRecentAiMemory();
  memory.push({
    role,
    text: cleanText.slice(0, 4000),
    createdAt: Date.now(),
  });
  writeJson(aiMemoryKey, memory.slice(-maxAiMemoryMessages));
  const conversations = readJson(aiConversationsKey, []);
  let conversation = conversations.find((item) => item.id === currentAiConversationId);
  if (!conversation) {
    conversation = { id: currentAiConversationId, createdAt: Date.now(), updatedAt: Date.now(), messages: [] };
    conversations.unshift(conversation);
  }
  conversation.messages.push({ role, text: cleanText.slice(0, 4000), createdAt: Date.now() });
  conversation.messages = conversation.messages.slice(-maxAiMemoryMessages);
  conversation.updatedAt = Date.now();
  writeJson(aiConversationsKey, conversations.filter((item) => Date.now() - item.updatedAt < aiMemoryTtlMs).slice(0, 20));
}

function clearAiMemory() {
  removeLocalValue(aiMemoryKey);
}

function startNewAiConversation() {
  currentAiConversationId = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  localStorage.setItem("brother.aiConversationId", currentAiConversationId);
  clearAiMemory();
  if (aiThread) {
    aiThread.innerHTML = `<article class="message ai-message"><div class="ai-message-stack"><div class="message-body rich-text"><p>Ask me about a verse, doctrine, original language, cross references, or biblical context.</p></div></div></article>`;
  }
}

function renderAiHistory() {
  if (!aiHistoryPanel) return;
  const conversations = readJson(aiConversationsKey, [])
    .filter((item) => Date.now() - Number(item.updatedAt || item.createdAt || 0) < aiMemoryTtlMs)
    .sort((a, b) => Number(b.updatedAt) - Number(a.updatedAt));
  writeJson(aiConversationsKey, conversations);
  aiHistoryPanel.innerHTML = `${conversations.length ? conversations.map((conversation) => {
    const firstUser = conversation.messages?.find((message) => message.role === "user");
    const preview = firstUser?.text || "New conversation";
    const shortPreview = preview.length > 30 ? `${preview.slice(0, 30).trim()}...` : preview;
    return `<button type="button" class="ai-history-item" data-ai-history-id="${escapeAttr(conversation.id)}"><span>${escapeHtml(shortPreview)}</span><i data-lucide="square-arrow-out-up-right" aria-hidden="true"></i></button>`;
  }).join("") : '<p class="ai-history-empty">No conversations in the last 24 hours.</p>'}<p class="ai-history-retention">Conversations are saved for 24 hours after your last message.</p>`;
  aiHistoryPanel.querySelectorAll("[data-ai-history-id]").forEach((button) => {
    button.addEventListener("click", () => loadAiConversation(button.dataset.aiHistoryId));
  });
  refreshIcons();
}

function loadAiConversation(id) {
  const conversation = readJson(aiConversationsKey, []).find((item) => item.id === id);
  if (!conversation || !aiThread) return;
  currentAiConversationId = id;
  localStorage.setItem("brother.aiConversationId", id);
  writeJson(aiMemoryKey, conversation.messages || []);
  aiThread.innerHTML = "";
  (conversation.messages || []).forEach((item) => appendAiMessage(item.role, item.text));
  setAiTab("chat");
}

function savePreferences() {
  savedPreferences.accent = normalizeAccentKey(savedPreferences.accent);
  writeJson("brother.preferences", savedPreferences);
  syncPreferencesRecord();
}

function getProfileInitials(name) {
  const words = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) {
    return defaultProfile.avatarInitials;
  }

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
    .slice(0, 3);
}

function saveProfile() {
  writeJson("brother.profile", savedProfile);
  syncProfileRecord();
}

function setProfileStyleFeedback(message, isError = false) {
  if (!profileStyleFeedback) return;
  profileStyleFeedback.textContent = message;
  profileStyleFeedback.dataset.state = isError ? "error" : "success";
}

function compressProfileCover(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxWidth = 1200;
        const scale = Math.min(1, maxWidth / image.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.onerror = () => reject(new Error("Unable to read this image."));
      image.src = reader.result;
    };
    reader.onerror = () => reject(new Error("Unable to read this image."));
    reader.readAsDataURL(file);
  });
}

async function syncProfileRecord() {
  if (!supabaseClient || !supabaseUser) return;
  const { error } = await supabaseClient.from("profiles").upsert({
    id: supabaseUser.id,
    email: supabaseUser.email || savedProfile.email || null,
    display_name: savedProfile.displayName,
    country: savedProfile.country || null,
    age: savedProfile.age ? Number(savedProfile.age) : null,
    bio: savedProfile.bio,
    streak: Number(readJson("brother.homeActivity", {}).streak || 0),
    updated_at: new Date().toISOString(),
  });
  if (error) setAuthFeedback(`Profile sync failed: ${error.message}`, true);
}

async function syncPreferencesRecord() {
  if (!supabaseClient || !supabaseUser) return;
  const { error } = await supabaseClient.from("user_preferences").upsert({
    user_id: supabaseUser.id,
    app_background: savedPreferences.background,
    text_size: savedPreferences.textSize,
    accent: savedPreferences.accent,
    updated_at: new Date().toISOString(),
  });
  if (error) setAuthFeedback(`Preferences sync failed: ${error.message}`, true);
}

function applyProfile() {
  const displayName = String(savedProfile.displayName || defaultProfile.displayName).trim() || defaultProfile.displayName;
  const streakLabel = String(savedProfile.streakLabel || defaultProfile.streakLabel).trim() || defaultProfile.streakLabel;
  const authStatus = String(savedProfile.authStatus || defaultProfile.authStatus).trim() || defaultProfile.authStatus;
  const storageStatus = String(savedProfile.storageStatus || defaultProfile.storageStatus).trim() || defaultProfile.storageStatus;
  const accountId = String(savedProfile.accountId || defaultProfile.accountId).trim() || defaultProfile.accountId;
  const avatarInitials = String(savedProfile.avatarInitials || "").trim().toUpperCase() || getProfileInitials(displayName);

  savedProfile.displayName = displayName;
  savedProfile.country = String(savedProfile.country || "").trim();
  savedProfile.dateOfBirth = String(savedProfile.dateOfBirth || "").trim();
  savedProfile.streakLabel = streakLabel;
  savedProfile.authStatus = authStatus;
  savedProfile.storageStatus = storageStatus;
  savedProfile.accountId = accountId;
  savedProfile.avatarInitials = avatarInitials;

  if (profileCover) {
    profileCover.src = savedProfile.coverImage || defaultProfile.coverImage;
  }

  if (profileAvatar) {
    const profilePhoto = profileAvatar.querySelector("img");
    if (!profilePhoto) {
      profileAvatar.textContent = avatarInitials;
    }
  }
  if (profileName) {
    profileName.textContent = displayName;
  }
  if (profileStreak) {
    profileStreak.textContent = streakLabel;
  }
  if (profileAuthStatus) {
    profileAuthStatus.textContent = authStatus;
  }
  if (profileStorageStatus) {
    profileStorageStatus.textContent = storageStatus;
  }
  if (profileAccountId) {
    profileAccountId.textContent = accountId;
  }

  if (profileForm) {
    const formData = new FormData(profileForm);
    if (formData.get("displayName") !== displayName) {
      profileForm.elements.displayName.value = displayName;
    }
    if (formData.get("country") !== (savedProfile.country || "")) {
      profileForm.elements.country.value = savedProfile.country || "";
    }
    if (formData.get("dateOfBirth") !== savedProfile.dateOfBirth) {
      profileForm.elements.dateOfBirth.value = savedProfile.dateOfBirth;
    }
  }
}

function setActivePreference(buttons, activeValue, dataKey) {
  buttons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset[dataKey] === activeValue);
  });
}

function applyPreferences() {
  savedPreferences.accent = normalizeAccentKey(savedPreferences.accent);
  const accent = accentOptions[savedPreferences.accent] || accentOptions[defaultPreferences.accent];
  const textSize = textSizeOptions[savedPreferences.textSize] || textSizeOptions[defaultPreferences.textSize];
  savedPreferences.background = "black";
  const background = "black";
  savedPreferences.background = background;

  appShell.dataset.appBackground = background;
  appShell.style.setProperty("--gold", accent.value);
  appShell.style.setProperty("--gold-soft", accent.soft);
  appShell.style.setProperty("--beige", accent.soft);
  appShell.style.setProperty("--accent-contrast", accent.contrast);
  appShell.style.setProperty("--reader-text-size", textSize);
  appShell.querySelector(".phone-frame")?.style.setProperty("--reader-text-size", textSize);

  setActivePreference(backgroundOptionButtons, savedPreferences.background, "backgroundOption");
  setActivePreference(textSizeOptionButtons, savedPreferences.textSize, "textSizeOption");
  setActivePreference(accentOptionButtons, savedPreferences.accent, "accentOption");
}

function centerBackgroundOption(value, behavior = "smooth") {
  const button = backgroundOptionsTrack?.querySelector(`[data-background-option="${CSS.escape(value)}"]`);
  button?.scrollIntoView({ behavior, block: "nearest", inline: "center" });
}

function initLoopingBackgroundCarousel() {
  if (!backgroundOptionsTrack) {
    return;
  }

  let isLooping = false;
  backgroundOptionsTrack.addEventListener("scroll", () => {
    if (isLooping) {
      return;
    }

    const maxScroll = backgroundOptionsTrack.scrollWidth - backgroundOptionsTrack.clientWidth;
    if (maxScroll <= 0) {
      return;
    }

    if (backgroundOptionsTrack.scrollLeft <= 1) {
      isLooping = true;
      backgroundOptionsTrack.scrollLeft = maxScroll - 2;
      window.requestAnimationFrame(() => {
        isLooping = false;
      });
    } else if (backgroundOptionsTrack.scrollLeft >= maxScroll - 1) {
      isLooping = true;
      backgroundOptionsTrack.scrollLeft = 2;
      window.requestAnimationFrame(() => {
        isLooping = false;
      });
    }
  });
}

function getApologeticsTrack() {
  return apologeticsTracksData.find((track) => track.id === apologeticsState.trackId) || apologeticsTracksData[0];
}

function getApologeticsTopics() {
  const track = getApologeticsTrack();
  const topics = track?.topics || [];
  return apologeticsState.category === "all"
    ? topics
    : topics.filter((topic) => topic.category === apologeticsState.category);
}

function getApologeticsTopic() {
  const track = getApologeticsTrack();
  return track?.topics.find((topic) => topic.id === apologeticsState.topicId) || track?.topics[0] || null;
}

function getAllApologeticsTopics() {
  return apologeticsTracksData.flatMap((track) => track.topics.map((topic) => ({ ...topic, trackId: track.id, trackTitle: track.title, trackLevel: track.level })));
}

function getTopicEstimatedMinutes(topic) {
  return topicDifficultyMinutes[topic.difficulty] || 8;
}

function getTopicXp(topic) {
  return topicDifficultyXp[topic.difficulty] || 80;
}

function getTrackEstimatedMinutes(track) {
  return track.topics.reduce((total, topic) => total + getTopicEstimatedMinutes(topic), 0);
}

function formatMinutes(minutes) {
  return `${minutes} min`;
}

function getTrackProgress(track) {
  const topicIds = track.topics.map((topic) => topic.id);
  const visitedCount = topicIds.filter((id) => apologeticsProgressState.visitedTopicIds.includes(id)).length;
  const completedCount = topicIds.filter((id) => apologeticsProgressState.completedTopicIds.includes(id)).length;
  const percent = Math.round((completedCount / track.topics.length) * 100) || 0;
  return {
    visitedCount,
    completedCount,
    percent,
    started: visitedCount > 0,
  };
}

function getTrackFrameworkDetails(track) {
  const trackUi = apologeticsTrackUi[track.id];
  return trackUi?.frameworkDetails || [
    {
      title: "Understand the claim",
      explanation: "Clarify exactly what the other person is objecting to before you answer.",
      example: "Ask whether the issue is about Scripture, doctrine, history, or the person of Christ.",
      mistakes: "Responding too fast or answering the wrong objection.",
      tip: "Repeat the objection back in one sentence first.",
    },
    {
      title: "Find the objection",
      explanation: "Locate the core tension driving the disagreement.",
      example: "A debate about miracles often hides a prior rejection of the supernatural.",
      mistakes: "Treating every objection like the same kind of argument.",
      tip: "Name the category of the objection before you answer.",
    },
    {
      title: "Answer biblically",
      explanation: "Use a small set of clear passages and explain them with context.",
      example: "Use one key verse, one supporting verse, and one short explanation.",
      mistakes: "Dropping references without interpretation.",
      tip: "Aim for clarity before quantity.",
    },
    {
      title: "Respond clearly",
      explanation: "Keep your tone calm and your structure simple so the answer can land.",
      example: "Lead with your strongest point, then invite the other person to reflect.",
      mistakes: "Overloading the answer or sounding combative.",
      tip: "End with a thoughtful question rather than a speech.",
    },
  ];
}

function getOpenFrameworkIndex(trackId, itemCount) {
  const rawIndex = apologeticsOverviewState.trackFrameworkOpen[trackId];
  return typeof rawIndex === "number" && rawIndex >= 0 && rawIndex < itemCount ? rawIndex : 0;
}

function getTopicCompletionState(topicId) {
  if (apologeticsProgressState.completedTopicIds.includes(topicId)) {
    return "Completed";
  }
  if (apologeticsProgressState.visitedTopicIds.includes(topicId)) {
    return "In progress";
  }
  return "Ready";
}

function getApologeticsOverviewProgress() {
  const allTopics = getAllApologeticsTopics();
  const completedCount = allTopics.filter((topic) => apologeticsProgressState.completedTopicIds.includes(topic.id)).length;
  const overallPercent = Math.round((completedCount / allTopics.length) * 100) || 0;
  const xpEarned = allTopics
    .filter((topic) => apologeticsProgressState.completedTopicIds.includes(topic.id))
    .reduce((total, topic) => total + getTopicXp(topic), 0);

  return {
    overallPercent,
    completedCount,
    totalTopics: allTopics.length,
    streak: apologeticsProgressState.streak || 1,
    xpEarned,
  };
}

function getTodaysApologeticsChallenge() {
  const allTopics = getAllApologeticsTopics();
  const dayNumber = Number(getTodayKey().replaceAll("-", ""));
  const challenge = allTopics[dayNumber % allTopics.length];
  return challenge
    ? {
      ...challenge,
      durationMinutes: getTopicEstimatedMinutes(challenge),
      xpReward: getTopicXp(challenge),
    }
    : null;
}

function saveApologeticsState() {
  setLocalValue("brother.apologetics.track", apologeticsState.trackId);
  setLocalValue("brother.apologetics.category", apologeticsState.category);
  setLocalValue("brother.apologetics.topic", apologeticsState.topicId);
  setLocalValue("brother.apologetics.selectedTrackTopic", apologeticsState.selectedTrackTopicId || "");
}

function saveApologeticsChatState() {
  writeJson(apologeticsChatKey, apologeticsChatState.conversations);
}

function ensureApologeticsState() {
  const track = getApologeticsTrack();
  if (!track) {
    return;
  }

  const categories = new Set(track.topics.map((topic) => topic.category));
  if (apologeticsState.category !== "all" && !categories.has(apologeticsState.category)) {
    apologeticsState.category = "all";
  }

  const visibleTopics = getApologeticsTopics();
  if (!visibleTopics.some((topic) => topic.id === apologeticsState.topicId)) {
    apologeticsState.topicId = visibleTopics[0]?.id || track.topics[0]?.id || "";
  }
  if (!visibleTopics.some((topic) => topic.id === apologeticsState.selectedTrackTopicId)) {
    apologeticsState.selectedTrackTopicId = "";
  }

  saveApologeticsState();
}

function getApologeticsConversationKey() {
  const track = getApologeticsTrack();
  const topic = getApologeticsTopic();
  return track && topic ? `${track.id}:${topic.id}` : "";
}

function buildApologeticsSeedConversation(track, topic) {
  const openingClaim = topic?.opponentCase?.[0] || `I disagree with the Christian view on ${topic?.title || "this topic"}.`;
  return {
    muslim: [
      {
        role: "assistant",
        text: `Opening objection from ${track.title}: ${openingClaim} Respond to me as if we were in a real conversation.`,
      },
    ],
    coach: [
      {
        role: "assistant",
        text: `Base objection to answer: "${openingClaim}"\n\nBuild your reply in the "From Muslim" tab. I will evaluate your answer here for clarity, biblical strength, tone, and strategy.`,
      },
    ],
  };
}

function getApologeticsConversation() {
  const key = getApologeticsConversationKey();
  if (!key) {
    return { muslim: [], coach: [] };
  }

  if (!apologeticsChatState.conversations[key]) {
    const track = getApologeticsTrack();
    const topic = getApologeticsTopic();
    apologeticsChatState.conversations[key] = buildApologeticsSeedConversation(track, topic);
    saveApologeticsChatState();
  }

  return apologeticsChatState.conversations[key];
}

function resizeApologeticsChatInput() {
  if (!apologeticsChatInput) {
    return;
  }

  apologeticsChatInput.style.height = "auto";
  const nextHeight = Math.min(apologeticsChatInput.scrollHeight, 144);
  apologeticsChatInput.style.height = `${nextHeight}px`;
  apologeticsChatInput.style.overflowY = apologeticsChatInput.scrollHeight > nextHeight ? "auto" : "hidden";
}

function setApologeticsChatPending(isPending, key = getApologeticsConversationKey()) {
  if (!key) {
    return;
  }

  if (isPending) {
    apologeticsChatState.pendingKeys[key] = true;
  } else {
    delete apologeticsChatState.pendingKeys[key];
  }

  const currentKey = getApologeticsConversationKey();
  const currentPending = Boolean(currentKey && apologeticsChatState.pendingKeys[currentKey]);
  if (apologeticsChatInput) {
    apologeticsChatInput.disabled = currentPending;
  }
  apologeticsChatForm?.querySelector("button")?.toggleAttribute("disabled", currentPending);
}

function renderApologeticsChat() {
  if (!apologeticsChatTabs || !apologeticsChatThread) {
    return;
  }

  const conversation = getApologeticsConversation();
  const activeTab = apologeticsChatState.activeTab;
  setApologeticsChatPending(Boolean(apologeticsChatState.pendingKeys[getApologeticsConversationKey()]), getApologeticsConversationKey());

  apologeticsChatTabs.querySelectorAll("[data-apologetics-chat-tab]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.apologeticsChatTab === activeTab);
  });

  const messages = conversation[activeTab] || [];
  if (!messages.length) {
    apologeticsChatThread.innerHTML = `
      <div class="apologetics-chat-empty">
        <strong>${activeTab === "muslim" ? "From Muslim" : "From Coach"}</strong>
        <p>${activeTab === "muslim"
    ? "Write your first answer and this tab will keep the conversation going like a real challenger."
    : "Write your first answer and this tab will critique your reasoning, references, and tone."}</p>
      </div>
    `;
    return;
  }

  apologeticsChatThread.innerHTML = messages.map((item) => {
    if (item.role === "user") {
      return `
        <article class="message user-message">
          <p>${escapeHtml(item.text)}</p>
        </article>
      `;
    }

    return `
      <article class="message ai-message">
        <div class="ai-message-stack">
          <div class="message-body${item.pending ? " shining-text" : " rich-text"}">${item.pending ? escapeHtml(item.text) : renderRichText(item.text)}</div>
        </div>
      </article>
    `;
  }).join("");

  apologeticsChatThread.scrollTop = apologeticsChatThread.scrollHeight;
}

async function requestApologeticsModeResponse(mode, requestId) {
  const track = getApologeticsTrack();
  const topic = getApologeticsTopic();
  const conversation = getApologeticsConversation();
  const history = (conversation[mode] || []).filter((item) => !item.pending).slice(-18);
  const response = await fetch("/api/ai/apologetics", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      mode,
      trackTitle: track?.title || "",
      topicTitle: topic?.title || "",
      topicSummary: topic?.summary || "",
      opponentCase: topic?.opponentCase || [],
      keyResponse: topic?.keyResponse || [],
      keyVerses: topic?.keyVerses || [],
      questionsToAsk: topic?.questionsToAsk || [],
      pitfalls: topic?.pitfalls || [],
      history,
      message: history.filter((item) => item.role === "user").slice(-1)[0]?.text || "",
    }),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Apologetics AI request failed.");
  }

  if (requestId !== apologeticsChatRequestId) {
    return;
  }

  const queue = conversation[mode] || [];
  const pendingIndex = queue.findIndex((item) => item.pending);
  if (pendingIndex >= 0) {
    queue[pendingIndex] = { role: "assistant", text: payload.text || "No response text returned." };
  } else {
    queue.push({ role: "assistant", text: payload.text || "No response text returned." });
  }
}

async function handleApologeticsChatSubmit(event) {
  event.preventDefault();
  const topic = getApologeticsTopic();
  const message = apologeticsChatInput?.value.trim();
  const conversationKey = getApologeticsConversationKey();
  if (!topic || !message || (conversationKey && apologeticsChatState.pendingKeys[conversationKey])) {
    return;
  }

  markApologeticsTopicCompleted(topic.id);
  const conversation = getApologeticsConversation();
  const pendingLabels = {
    muslim: "From Muslim is replying...",
    coach: "Coach is reviewing your answer...",
  };

  apologeticsChatInput.value = "";
  resizeApologeticsChatInput();
  setApologeticsChatPending(true, conversationKey);
  apologeticsChatRequestId += 1;
  const requestId = apologeticsChatRequestId;

  ["muslim", "coach"].forEach((mode) => {
    conversation[mode].push({ role: "user", text: message });
    conversation[mode].push({ role: "assistant", text: pendingLabels[mode], pending: true });
  });

  saveApologeticsChatState();
  renderApologeticsChat();

  try {
    await Promise.all([
      requestApologeticsModeResponse("muslim", requestId),
      requestApologeticsModeResponse("coach", requestId),
    ]);
    saveApologeticsChatState();
  } catch (error) {
    ["muslim", "coach"].forEach((mode) => {
      const queue = conversation[mode] || [];
      const pendingIndex = queue.findIndex((item) => item.pending);
      if (pendingIndex >= 0) {
        queue[pendingIndex] = { role: "assistant", text: error.message || "Apologetics AI is not available yet." };
      }
    });
    saveApologeticsChatState();
  } finally {
    if (requestId === apologeticsChatRequestId) {
      setApologeticsChatPending(false, conversationKey);
      renderApologeticsChat();
      apologeticsChatInput?.focus();
    }
  }
}

function launchApologeticsCoach(mode = "coach") {
  const track = getApologeticsTrack();
  const topic = getApologeticsTopic();
  if (!track || !topic || !aiComposerInput) {
    return;
  }

  const prompts = {
    overview: `Create a practical apologetics training plan for conversations about ${track.title}. Prioritize the biggest objections, strongest biblical answers, common traps, and 5 memory verses.`,
    coach: `You are my apologetics coach. Topic: ${track.title} > ${topic.title}. Give me a concise training answer with: what they say, what I should say, key verses, questions to ask back, and traps to avoid.`,
    debate: `Roleplay a realistic debate with me. You act like a well-informed ${track.title} challenger on the topic "${topic.title}". Raise one objection at a time, wait for my reply, then critique my answer and continue.`,
    refine: `Improve my apologetics response on the topic ${track.title} > ${topic.title}. Give me a short answer, a stronger expanded answer, biblical support, and a more gracious tone.`,
  };

  setScreen("ai");
  aiComposerInput.value = prompts[mode] || prompts.coach;
  resizeAiComposerInput();
  aiComposerInput.focus();
}

async function copyApologeticsShortAnswer() {
  const topic = getApologeticsTopic();
  if (!topic?.shortAnswer) {
    return;
  }

  try {
    await navigator.clipboard.writeText(topic.shortAnswer);
    setFeedback("Short answer copied.");
  } catch {
    setFeedback("Copy is not available in this browser.");
  }
}

function renderApologeticsTracks() {
  if (!apologeticsTracks) {
    return;
  }

  apologeticsTracks.innerHTML = apologeticsTracksData.map((track) => {
    const progress = getTrackProgress(track);
    return `
      <button class="apologetics-track-card apologetics-track-card--${escapeAttr(track.id)}" data-apologetics-track="${escapeAttr(track.id)}">
        <span class="apologetics-track-card-top">
          <i data-lucide="${escapeAttr(track.icon)}"></i>
          <small>${escapeHtml(track.level)}</small>
        </span>
        <strong>${escapeHtml(track.title)}</strong>
        <p>${escapeHtml(track.description)}</p>
        <div class="apologetics-track-card-metrics">
          <span><strong>${track.topics.length}</strong><small>Topics</small></span>
          <span><strong>${formatMinutes(getTrackEstimatedMinutes(track))}</strong><small>Estimate</small></span>
          <span><strong>${progress.percent}%</strong><small>Progress</small></span>
        </div>
        <div class="apologetics-track-card-footer">
          <span class="apologetics-track-progress-bar"><span style="width:${progress.percent}%"></span></span>
          <span class="apologetics-track-card-cta">${progress.started ? "Continue" : "Start training"}</span>
        </div>
      </button>
    `;
  }).join("");
}

function renderApologeticsFeaturedTopics() {
  if (!apologeticsTopics) {
    return;
  }

  apologeticsTopics.innerHTML = apologeticsTracksData.map((track) => {
    const featuredTopics = track.topics.slice(0, 3);
    const isExpanded = apologeticsOverviewState.featuredOpenTrackId === track.id;
    return `
      <section class="apologetics-featured-group${isExpanded ? " is-expanded" : ""}" data-apologetics-featured-group="${escapeAttr(track.id)}">
        <button class="section-heading apologetics-featured-group-heading" type="button" data-apologetics-featured-toggle="${escapeAttr(track.id)}" aria-expanded="${isExpanded ? "true" : "false"}" aria-controls="apologetics-topic-dropdown-${escapeAttr(track.id)}">
          <span class="apologetics-featured-group-heading-copy">
            <small>${escapeHtml(track.level)} track</small>
            <h3>${escapeHtml(track.title)}</h3>
            <p>${escapeHtml(track.description)}</p>
          </span>
          <span class="apologetics-featured-group-heading-side">
            <span>${featuredTopics.length}</span>
            <span class="apologetics-featured-group-heading-state">${isExpanded ? "Close" : "Open"}</span>
            <i data-lucide="chevron-down"></i>
          </span>
        </button>
        <div class="apologetics-topic-dropdown" id="apologetics-topic-dropdown-${escapeAttr(track.id)}"${isExpanded ? "" : " hidden"}>
          <div class="apologetics-topic-dropdown-list">
          ${featuredTopics.map((topic) => `
            <button class="apologetics-topic-card apologetics-topic-card--carousel" type="button" data-apologetics-topic="${escapeAttr(topic.id)}" data-apologetics-track-jump="${escapeAttr(track.id)}">
              <span class="apologetics-topic-meta">
                <small>${escapeHtml(topic.category)}</small>
              </span>
              <strong>${escapeHtml(topic.title)}</strong>
              <p>${escapeHtml(topic.summary)}</p>
              <span class="apologetics-topic-meta-row">
                <small>${escapeHtml(topic.difficulty)}</small>
                <small>${formatMinutes(getTopicEstimatedMinutes(topic))}</small>
                <small>${getTopicCompletionState(topic.id)}</small>
              </span>
              <span class="apologetics-topic-open">Open topic</span>
            </button>
          `).join("")}
          </div>
        </div>
      </section>
    `;
  }).join("");
}

function renderApologeticsChallenge() {
  if (!apologeticsChallenge) {
    return;
  }

  const challenge = getTodaysApologeticsChallenge();
  if (!challenge) {
    apologeticsChallenge.innerHTML = "";
    return;
  }

  apologeticsChallenge.innerHTML = `
    <button class="apologetics-challenge-button" type="button" data-apologetics-topic="${escapeAttr(challenge.id)}" data-apologetics-track-jump="${escapeAttr(challenge.trackId)}">
      <span class="apologetics-challenge-top">
        <small>Featured objection</small>
        <strong>+${challenge.xpReward} XP</strong>
      </span>
      <h3>${escapeHtml(challenge.title)}</h3>
      <p>${escapeHtml(challenge.opponentCase[0] || challenge.summary)}</p>
      <div class="apologetics-challenge-meta">
        <span>${escapeHtml(challenge.trackTitle)}</span>
        <span>${formatMinutes(challenge.durationMinutes)}</span>
      </div>
    </button>
  `;
}

function renderApologeticsProgress() {
  if (!apologeticsProgress) {
    return;
  }

  const overview = getApologeticsOverviewProgress();
  apologeticsProgress.innerHTML = `
    <article class="apologetics-progress-card apologetics-progress-card--cyan">
      <small>Overall Completion</small>
      <strong>${overview.overallPercent}%</strong>
      <span>Across all apologetics tracks</span>
    </article>
    <article class="apologetics-progress-card apologetics-progress-card--green">
      <small>Topics Completed</small>
      <strong>${overview.completedCount}/${overview.totalTopics}</strong>
      <span>Finished lessons so far</span>
    </article>
    <article class="apologetics-progress-card apologetics-progress-card--violet">
      <small>Current Streak</small>
      <strong>${overview.streak}</strong>
      <span>Consecutive active days</span>
    </article>
    <article class="apologetics-progress-card apologetics-progress-card--amber">
      <small>XP Earned</small>
      <strong>${overview.xpEarned}</strong>
      <span>Training points collected</span>
    </article>
  `;
}

function renderApologeticsFilters() {
  if (!apologeticsFilters) {
    return;
  }

  const track = getApologeticsTrack();
  const categories = ["all", ...new Set((track?.topics || []).map((topic) => topic.category))];
  apologeticsFilters.innerHTML = categories.map((category) => `
    <button class="${category === apologeticsState.category ? "is-active" : ""}" data-apologetics-filter="${escapeAttr(category)}">
      ${escapeHtml(category === "all" ? "All" : category)}
    </button>
  `).join("");
}

function renderApologeticsTrackScreen() {
  const track = getApologeticsTrack();
  if (!track || !apologeticsTrackTitle || !apologeticsTrackHero || !apologeticsTrackTopics || !apologeticsTopicCount) {
    return;
  }

  const trackProgress = getTrackProgress(track);
  const selectedTopic = track.topics.find((topic) => topic.id === apologeticsState.selectedTrackTopicId);
  const trackUi = apologeticsTrackUi[track.id] || {
    summary: track.description,
  };
  const frameworkDetails = getTrackFrameworkDetails(track);
  const openFrameworkIndex = getOpenFrameworkIndex(track.id, frameworkDetails.length);
  const activeFramework = frameworkDetails[openFrameworkIndex];
  const topics = getApologeticsTopics();
  apologeticsTrackTitle.textContent = track.title;
  apologeticsTrackHero.className = `apologetics-hero apologetics-hero--track apologetics-hero--track-${track.id}`;
  apologeticsTrackHero.innerHTML = `
    <div class="apologetics-hero-copy">
      <span class="label">${escapeHtml(track.level)} track</span>
      <h2>${escapeHtml(track.title)}</h2>
      <p>${escapeHtml(trackUi.summary)}</p>
    </div>
    <div class="apologetics-hero-stats">
      <span><strong>${track.topics.length}</strong><small>topics</small></span>
      <span><strong>${formatMinutes(getTrackEstimatedMinutes(track))}</strong><small>estimate</small></span>
      <span><strong>${escapeHtml(track.level)}</strong><small>difficulty</small></span>
    </div>
    <div class="apologetics-track-hero-progress">
      <div class="apologetics-track-hero-progress-top">
        <strong>${trackProgress.percent}% complete</strong>
        <span>${trackProgress.completedCount}/${track.topics.length} topics</span>
      </div>
      <span class="apologetics-track-progress-bar"><span style="width:${trackProgress.percent}%"></span></span>
    </div>
  `;
  if (apologeticsTrackProgress) {
    apologeticsTrackProgress.innerHTML = `
      <div class="apologetics-track-progress-copy">
        <strong>Completed: ${trackProgress.completedCount} / ${track.topics.length} Topics</strong>
        <p>${trackProgress.started ? "You already have momentum on this path. Resume where you left off and keep compounding your answers." : "Start with one core objection and build confidence one topic at a time."}</p>
      </div>
      <span class="apologetics-track-progress-bar apologetics-track-progress-bar--large"><span style="width:${trackProgress.percent}%"></span></span>
    `;
  }
  if (apologeticsTrackQuick) {
    apologeticsTrackQuick.innerHTML = `
      <div class="apologetics-quick-head">
        <strong>Quick framework</strong>
      </div>
      <div class="apologetics-quick-steps">
        ${frameworkDetails.map((step, index) => `
          <button class="${index === openFrameworkIndex ? "is-active" : ""}" data-apologetics-framework-step="${index}">
            <small>${index + 1}</small>
            <span>${escapeHtml(step.title)}</span>
          </button>
        `).join("")}
      </div>
      <article class="apologetics-framework-detail">
        <h3>${escapeHtml(activeFramework.title)}</h3>
        <div class="apologetics-framework-grid">
          <section>
            <strong>Explanation</strong>
            <p>${escapeHtml(activeFramework.explanation)}</p>
          </section>
          <section>
            <strong>Practical Example</strong>
            <p>${escapeHtml(activeFramework.example)}</p>
          </section>
          <section>
            <strong>Common Mistakes</strong>
            <p>${escapeHtml(activeFramework.mistakes)}</p>
          </section>
          <section>
            <strong>Tip</strong>
            <p>${escapeHtml(activeFramework.tip)}</p>
          </section>
        </div>
      </article>
    `;
  }
  if (apologeticsTrackRewards) {
    const unlocked = trackProgress.percent >= 100;
    apologeticsTrackRewards.innerHTML = `
      <div class="apologetics-rewards-head">
        <strong>Rewards</strong>
        <span>${unlocked ? "Unlocked" : "Finish this track to unlock"}</span>
      </div>
      <div class="apologetics-rewards-grid">
        ${["Intermediate Track", "Advanced Debate Mode", "New AI Coach"].map((reward) => `
          <span class="${unlocked ? "is-unlocked" : ""}">
            <small>${unlocked ? "Ready" : "Locked"}</small>
            <strong>${escapeHtml(reward)}</strong>
          </span>
        `).join("")}
      </div>
    `;
  }
  if (apologeticsSelectionLine) {
    apologeticsSelectionLine.textContent = selectedTopic
      ? `Selected topic: ${selectedTopic.title}`
      : `Choose a topic to keep building this ${track.level.toLowerCase()} learning path.`;
    apologeticsSelectionLine.classList.toggle("is-active", Boolean(selectedTopic));
  }
  apologeticsTopicCount.textContent = String(topics.length);
  apologeticsTrackTopics.innerHTML = topics.map((topic) => {
    const completionState = getTopicCompletionState(topic.id);
    const isSelected = topic.id === apologeticsState.selectedTrackTopicId;
    return `
    <button class="apologetics-topic-card apologetics-topic-card--${escapeAttr(topic.category.toLowerCase())} ${isSelected ? "is-selected" : ""}" type="button" data-apologetics-topic="${escapeAttr(topic.id)}" aria-pressed="${isSelected ? "true" : "false"}">
      <span class="apologetics-topic-meta">
        <small>${escapeHtml(topic.category)}</small>
        <span class="apologetics-topic-status ${completionState === "Completed" ? "is-completed" : completionState === "In progress" ? "is-progress" : ""}">${escapeHtml(completionState)}</span>
      </span>
      <strong>${escapeHtml(topic.title)}</strong>
      <p>${escapeHtml(topic.summary)}</p>
      <span class="apologetics-topic-meta-row">
        <small>${escapeHtml(topic.difficulty)}</small>
        <small>${formatMinutes(getTopicEstimatedMinutes(topic))}</small>
        <small>${topic.keyVerses.length} verses</small>
      </span>
      <span class="apologetics-topic-plus" aria-hidden="true">
        <i data-lucide="${isSelected ? "minus" : "plus"}"></i>
      </span>
    </button>
  `;
  }).join("");
  renderApologeticsBeginButton();
}

function renderApologeticsBeginButton() {
  if (!apologeticsBeginButton) {
    return;
  }

  if (appShell?.dataset.activeScreen !== "apologetics-track") {
    apologeticsBeginButton.hidden = true;
    return;
  }

  const track = getApologeticsTrack();
  const trackProgress = track ? getTrackProgress(track) : { started: false };
  const fallbackTopicId = apologeticsState.selectedTrackTopicId || apologeticsState.topicId || getApologeticsTopics()[0]?.id || "";
  apologeticsBeginButton.hidden = false;
  const buttonLabel = trackProgress.started ? "Resume where you left off" : "Continue Learning";
  apologeticsBeginButton.textContent = buttonLabel;
  apologeticsBeginButton.dataset.label = buttonLabel;
  apologeticsBeginButton.classList.toggle("is-disabled", !fallbackTopicId);
  apologeticsBeginButton.setAttribute("aria-disabled", fallbackTopicId ? "false" : "true");
}

function renderApologeticsTopicScreen() {
  const track = getApologeticsTrack();
  const topic = getApologeticsTopic();
  if (!track || !topic || !apologeticsDetail || !apologeticsTopicBreadcrumb || !apologeticsTopicTitle) {
    if (apologeticsDetail) {
      apologeticsDetail.innerHTML = '<p class="saved-empty">No topic available yet.</p>';
    }
    return;
  }

  markApologeticsTopicVisited(topic.id);
  apologeticsTopicBreadcrumb.textContent = track.title;
  apologeticsTopicTitle.textContent = topic.title;
  apologeticsTopicTabs?.querySelectorAll("[data-apologetics-topic-tab]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.apologeticsTopicTab === apologeticsChatState.activeTopicView);
  });
  apologeticsDetail.hidden = apologeticsChatState.activeTopicView !== "introduction";
  const chatPanel = document.querySelector(".apologetics-chat-panel");
  if (chatPanel) {
    chatPanel.hidden = apologeticsChatState.activeTopicView !== "chat";
  }
  apologeticsDetail.innerHTML = `
    <div class="apologetics-intro-header">
      <span class="apologetics-intro-kicker">${escapeHtml(topic.category)}</span>
      <h2>${escapeHtml(topic.title)}</h2>
      <p class="apologetics-summary">${escapeHtml(topic.summary)}</p>
    </div>
    <div class="apologetics-intro-flow">
      <article class="apologetics-intro-block">
        <strong>The objection</strong>
        <p>${escapeHtml(topic.opponentCase[0] || topic.summary)}</p>
        <ul class="apologetics-bullet-list">
          ${topic.opponentCase.slice(1).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </article>
      <article class="apologetics-intro-block">
        <strong>The short answer</strong>
        <p>${escapeHtml(topic.shortAnswer)}</p>
      </article>
      <article class="apologetics-intro-block">
        <strong>How to respond clearly</strong>
        <ul class="apologetics-bullet-list">
          ${topic.keyResponse.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </article>
      <article class="apologetics-intro-block">
        <strong>Key verses</strong>
        <div class="apologetics-verse-tags">
          ${topic.keyVerses.map((verse) => `<span>${escapeHtml(verse.replaceAll(".", " "))}</span>`).join("")}
        </div>
      </article>
      <article class="apologetics-intro-block">
        <strong>Questions to ask back</strong>
        <ul class="apologetics-bullet-list">
          ${topic.questionsToAsk.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </article>
      <article class="apologetics-intro-block">
        <strong>What to avoid</strong>
        <ul class="apologetics-bullet-list">
          ${topic.pitfalls.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </article>
      <article class="apologetics-intro-block">
        <strong>Expanded explanation</strong>
        <p>${escapeHtml(topic.longAnswer)}</p>
      </article>
    </div>
  `;
  renderApologeticsChat();
}

function renderApologetics() {
  touchApologeticsProgress();
  ensureApologeticsState();
  renderApologeticsChallenge();
  renderApologeticsProgress();
  renderApologeticsTracks();
  renderApologeticsFeaturedTopics();
  renderApologeticsFilters();
  renderApologeticsTrackScreen();
  renderApologeticsTopicScreen();
  refreshIcons();
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function getKidsBiblePagePath(page, bookId = kidsBibleState.bookId) {
  const book = getKidsBibleBook(bookId);
  const number = String(page).padStart(2, "0");
  return `${book.imageDir}/${book.getFileName(number)}`;
}

function renderKidsBiblePage() {
  if (!kidsBiblePageImage) return;
  const book = getKidsBibleBook(kidsBibleState.bookId);
  kidsBiblePageImage.src = getKidsBiblePagePath(kidsBibleState.page);
  kidsBiblePageImage.alt = `${book.title} illustrated page ${kidsBibleState.page}`;
  if (kidsBiblePageLabel) kidsBiblePageLabel.textContent = `${kidsBibleState.page} / ${book.totalPages}`;
  if (kidsBiblePageSelect) {
    if (kidsBiblePageSelect.dataset.bookId !== kidsBibleState.bookId) {
      kidsBiblePageSelect.innerHTML = Array.from({ length: book.totalPages }, (_, index) => `<option value="${index + 1}">Page ${index + 1}</option>`).join("");
      kidsBiblePageSelect.dataset.bookId = kidsBibleState.bookId;
    }
    kidsBiblePageSelect.value = String(kidsBibleState.page);
  }
  if (kidsBibleProgress) kidsBibleProgress.style.width = `${(kidsBibleState.page / book.totalPages) * 100}%`;
  if (kidsBibleReaderTitle) kidsBibleReaderTitle.textContent = book.title;
  renderKidsBibleLibraryProgress();
  setLocalValue("brother.kidsBibleBook", kidsBibleState.bookId);
  setLocalValue(getKidsBiblePageStorageKey(kidsBibleState.bookId), String(kidsBibleState.page));
  setLocalValue("brother.kidsBiblePage", String(kidsBibleState.page));
}

function renderKidsBibleLibraryProgress() {
  document.querySelectorAll("[data-kids-book]").forEach((card) => {
    const bookId = card.dataset.kidsBook;
    const book = getKidsBibleBook(bookId);
    const currentPage = bookId === kidsBibleState.bookId ? kidsBibleState.page : readKidsBiblePage(bookId);
    const percentage = Math.round((currentPage / book.totalPages) * 100);
    const progressFill = card.querySelector("[data-kids-book-progress-fill]");
    const progressLabel = card.querySelector("[data-kids-book-progress-label]");
    const progressBar = progressFill?.parentElement;
    if (progressFill) progressFill.style.width = `${percentage}%`;
    if (progressLabel) progressLabel.textContent = `Page ${currentPage} of ${book.totalPages} · ${percentage}%`;
    if (progressBar) {
      progressBar.setAttribute("aria-valuemax", String(book.totalPages));
      progressBar.setAttribute("aria-valuenow", String(currentPage));
    }
  });
}

function changeKidsBiblePage(delta) {
  const book = getKidsBibleBook(kidsBibleState.bookId);
  const nextPage = kidsBibleState.page + delta;
  if (nextPage < 1 || nextPage > book.totalPages) return;
  kidsBibleState.page = nextPage;
  renderKidsBiblePage();
  if (kidsBibleImageWrap) {
    const animationClass = delta > 0 ? "is-slide-next" : "is-slide-previous";
    kidsBibleImageWrap.classList.remove("is-slide-next", "is-slide-previous");
    window.requestAnimationFrame(() => {
      kidsBibleImageWrap.classList.add(animationClass);
      window.setTimeout(() => kidsBibleImageWrap.classList.remove(animationClass), 280);
    });
  }
}

function openKidsBibleBook(bookId) {
  kidsBibleState.bookId = kidsBibleBooks[bookId] ? bookId : "matthew";
  kidsBibleState.page = readKidsBiblePage(kidsBibleState.bookId);
  if (kidsBibleLibrary) kidsBibleLibrary.hidden = true;
  if (kidsBibleReader) kidsBibleReader.hidden = false;
  appShell.dataset.kidsReader = "true";
  renderKidsBiblePage();
}

function closeKidsBibleReader() {
  if (kidsBibleReader) kidsBibleReader.hidden = true;
  if (kidsBibleLibrary) kidsBibleLibrary.hidden = false;
  delete appShell.dataset.kidsReader;
}

function emitKidsBibleChange() {
  window.dispatchEvent(new CustomEvent("kids-bible:state-change"));
}

renderKidsBibleLibraryProgress();

function setScreen(id) {
  if (noteEditorPanel?.classList.contains("is-visible")) {
    closeModal();
  }
  const activeNavId = id.startsWith("apologetics") ? "apologetics" : id;
  if (id !== "bible" && multiSelectMode) {
    exitMultiSelectMode();
  }
  if (id !== "kids-bible") {
    delete appShell.dataset.kidsReader;
  }
  appShell.dataset.activeScreen = id;
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
    if (sessionStorage.getItem(apologeticsGateSessionKey) !== "true" && apologeticsGate) {
      apologeticsGate.hidden = false;
      window.setTimeout(() => apologeticsGateInput?.focus(), 80);
    }
  } else if (apologeticsGate) {
    apologeticsGate.hidden = true;
  }

  if (id === "prayer") {
    renderPrayerPage();
  }

  renderApologeticsBeginButton();
  window.dispatchEvent(new CustomEvent("app:screen-change", {
    detail: { id, activeNavId },
  }));
}

let lastReaderScrollTop = 0;
let readerScrollFrame = 0;

readerScreen?.addEventListener("scroll", () => {
  if (readerScrollFrame) return;

  readerScrollFrame = window.requestAnimationFrame(() => {
    const currentScrollTop = readerScreen.scrollTop;
    const scrollingDown = currentScrollTop > lastReaderScrollTop + 4;
    const scrollingUp = currentScrollTop < lastReaderScrollTop - 4;

    if (currentScrollTop <= 4 || scrollingUp) {
      bottomNav?.classList.remove("is-scroll-hidden");
    } else if (scrollingDown) {
      bottomNav?.classList.add("is-scroll-hidden");
    }

    updateFocusedVerseFromScroll();

    lastReaderScrollTop = currentScrollTop;
    readerScrollFrame = 0;
  });
});

function showModal(panel) {
  const isNotePanel = panel === noteEditorPanel;
  if (!isNotePanel) {
    [searchPanel, verseSheet, verseAiPanel, noteEditorPanel].forEach((item) => item?.classList.remove("is-visible"));
  } else {
    searchPanel?.classList.remove("is-visible");
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
  [searchPanel, verseSheet, verseAiPanel, noteEditorPanel].forEach((item) => item?.classList.remove("is-visible"));
  verseSheet?.classList.remove("is-original-language");
  modalLayer.hidden = true;
  delete appShell.dataset.modal;
  readerScreen?.classList.remove("is-verse-focused");
  document.querySelectorAll(".scripture-line.is-selected, .parallel-scripture-line.is-selected").forEach((line) => line.classList.remove("is-selected"));
  hideVerseDetail();
}

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
  navigator.vibrate?.(8);
}

let verseSheetTouchStartY = 0;
let verseSheetTouchOnPanel = false;
let verseSheetPanelTouchStartY = 0;
let verseSheetPanelDragging = false;

verseSheet?.addEventListener("touchstart", (event) => {
  if (appShell?.dataset.modal !== "verse" || !event.target.closest(".modal-handle, .sheet-title")) return;
  verseSheetPanelTouchStartY = event.touches[0]?.clientY || 0;
  verseSheetPanelDragging = true;
  verseSheet.classList.add("is-dragging");
}, { passive: true });

verseSheet?.addEventListener("touchmove", (event) => {
  if (!verseSheetPanelDragging) return;
  const currentY = event.touches[0]?.clientY || verseSheetPanelTouchStartY;
  const delta = Math.max(0, currentY - verseSheetPanelTouchStartY);
  if (!delta) return;
  event.preventDefault();
  verseSheet.style.transform = `translateY(${Math.min(delta, 180)}px)`;
}, { passive: false });

verseSheet?.addEventListener("touchend", () => {
  if (!verseSheetPanelDragging) return;
  const delta = Number.parseFloat(verseSheet.style.transform.match(/[-\d.]+/)?.[0] || "0");
  verseSheetPanelDragging = false;
  verseSheet.classList.remove("is-dragging");
  verseSheet.style.transform = "";
  if (delta > 72) closeModal();
});

verseSheet?.addEventListener("touchcancel", () => {
  verseSheetPanelDragging = false;
  verseSheet.classList.remove("is-dragging");
  verseSheet.style.transform = "";
}, { passive: true });

modalLayer?.addEventListener("wheel", (event) => {
  if (appShell?.dataset.modal !== "verse" || event.target.closest(".bottom-sheet")) return;
  event.preventDefault();
  readerScreen.scrollBy({ top: event.deltaY, behavior: "auto" });
});

modalLayer?.addEventListener("touchstart", (event) => {
  if (appShell?.dataset.modal !== "verse") return;
  verseSheetTouchOnPanel = Boolean(event.target.closest(".bottom-sheet"));
  if (!verseSheetTouchOnPanel) verseSheetTouchStartY = event.touches[0]?.clientY || 0;
}, { passive: true });

modalLayer?.addEventListener("touchmove", (event) => {
  if (appShell?.dataset.modal !== "verse" || verseSheetTouchOnPanel) return;
  const currentY = event.touches[0]?.clientY || verseSheetTouchStartY;
  const delta = verseSheetTouchStartY - currentY;
  if (Math.abs(delta) < 1) return;
  event.preventDefault();
  readerScreen.scrollBy({ top: delta, behavior: "auto" });
  verseSheetTouchStartY = currentY;
}, { passive: false });

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
  return versions.filter((version) => {
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
  const remoteVersions = readerState.versions.filter((version) => version.source === "api-bible");

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
  const response = await fetch(`/api/bible/chapter?${params.toString()}`);
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
  originalLanguageLabel.textContent = getOriginalLanguage(book.id).label;
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
      <div class="reader-empty">
        <strong>Aucun verset highlighté dans ce chapitre.</strong>
        <span>Highlight un verset, puis utilise Cible pour l'isoler ici.</span>
      </div>
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

function escapeAttr(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
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
    '<option value="">Comparer avec</option>',
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
    const response = await fetch("/api/bible/versions");
    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    const remoteVersions = payload.data || [];
    if (!remoteVersions.length) {
      return;
    }

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
      <button class="secondary-button${currentHighlight ? " is-highlight-active" : ""}" data-remove-highlight>Remove Highlight</button>
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
        <strong>Voir les versets</strong>
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

function askAiAboutVerse() {
  startNewAiConversation();
  closeModal();
  setScreen("ai");
  const versePrompt = `Explain ${selectedVerseData.reference} (${selectedVerseData.version}) with biblical context, original language, cross references, and application. Verse: "${selectedVerseData.text}"`;
  document.dispatchEvent(new CustomEvent("ai:prefill", { detail: { prompt: versePrompt } }));
  if (aiComposerInput) {
    stopAiComposerPromptRotation();
    aiComposerInput.value = versePrompt;
    resizeAiComposerInput();
    aiComposerInput.focus();
  }
}

function setAiTab(tab) {
  aiTabs.forEach((button) => button.classList.toggle("is-active", button.dataset.aiTab === tab));
  document.querySelector("#ai")?.classList.toggle("is-history", tab === "history");
  if (!aiThread || !aiHistoryPanel) return;
  const isHistory = tab === "history";
  aiThread.hidden = isHistory;
  aiHistoryPanel.hidden = !isHistory;
  if (isHistory) renderAiHistory();
}

function openVerseAiChat(verseData) {
  verseAiContextData = verseData;
  if (!verseAiPanel || !verseAiReference || !verseAiContext || !verseAiThread) {
    askAiAboutVerse();
    return;
  }

  verseAiReference.textContent = `${verseData.reference} · ${verseData.version}`;
  verseAiContext.textContent = verseData.text;
  verseAiThread.innerHTML = `
    <article class="message ai-message">
      <div class="ai-message-stack">
        <div class="message-body rich-text"><p>This chat is locked to ${escapeHtml(verseData.reference)}. Every answer will stay connected to this verse.</p></div>
      </div>
    </article>
  `;
  showModal(verseAiPanel);
  scrollVerseAiThreadToBottom();
  refreshIcons();
}

function scrollVerseAiThreadToBottom() {
  if (verseAiThread) {
    verseAiThread.scrollTop = verseAiThread.scrollHeight;
  }
}

function handleVerseAiSubmit(event) {
  event.preventDefault();
  if (!verseAiContextData || !verseAiInput || !verseAiThread) {
    return;
  }

  const question = verseAiInput.value.trim();
  if (!question) {
    return;
  }

  verseAiThread.insertAdjacentHTML("beforeend", `
    <article class="message user-message">
      <p>${escapeHtml(question)}</p>
    </article>
    <article class="message ai-message">
      <div class="ai-message-stack">
        <div class="message-body shining-text" data-verse-ai-pending>Brother AI is thinking with ${escapeHtml(verseAiContextData.reference)}...</div>
        <div class="ai-message-actions">
          <button type="button" class="ai-action-button" data-ai-action="copy" aria-label="Copier la réponse" title="Copier">
            <i data-lucide="copy"></i>
          </button>
          <button type="button" class="ai-action-button" data-ai-action="bookmark" aria-label="Bookmark la réponse" title="Bookmark">
            <i data-lucide="bookmark"></i>
          </button>
        </div>
      </div>
    </article>
  `);
  verseAiInput.value = "";
  refreshIcons();
  scrollVerseAiThreadToBottom();
  requestVerseAiResponse(question);
}

function scrollAiThreadToBottom() {
  if (aiThread) {
    aiThread.scrollTop = aiThread.scrollHeight;
  }
}

function resizeAiComposerInput() {
  if (!aiComposerInput) {
    return;
  }

  aiComposerInput.style.height = "auto";
  const nextHeight = Math.min(aiComposerInput.scrollHeight, 168);
  aiComposerInput.style.height = `${nextHeight}px`;
  aiComposerInput.style.overflowY = aiComposerInput.scrollHeight > nextHeight ? "auto" : "hidden";
}

const aiComposerPrompts = [
  "Tu as une question ?",
  "Tu cherches un verset ?",
  "Tu veux comparer le sens d’un mot ?",
];
let aiComposerPromptIndex = 0;
let aiComposerPromptTimer = null;
let aiComposerPromptFadeTimer = null;

function stopAiComposerPromptRotation() {
  window.clearInterval(aiComposerPromptTimer);
  window.clearTimeout(aiComposerPromptFadeTimer);
  aiComposerPromptTimer = null;
  aiComposerPromptFadeTimer = null;
  aiComposerInput?.classList.remove("is-placeholder-fading");
  if (aiComposerInput) aiComposerInput.placeholder = "";
}

function startAiComposerPromptRotation() {
  if (!aiComposerInput || aiComposerInput.value.trim()) return;
  stopAiComposerPromptRotation();
  aiComposerInput.placeholder = aiComposerPrompts[aiComposerPromptIndex];
  aiComposerPromptTimer = window.setInterval(() => {
    if (aiComposerInput.value.trim()) {
      stopAiComposerPromptRotation();
      return;
    }
    aiComposerInput.classList.add("is-placeholder-fading");
    aiComposerPromptFadeTimer = window.setTimeout(() => {
      aiComposerPromptIndex = (aiComposerPromptIndex + 1) % aiComposerPrompts.length;
      aiComposerInput.placeholder = aiComposerPrompts[aiComposerPromptIndex];
      aiComposerInput.classList.remove("is-placeholder-fading");
    }, 260);
  }, 2000);
}

function appendAiMessage(role, text) {
  if (!aiThread) {
    return;
  }

  const article = document.createElement("article");
  article.className = `message ${role === "user" ? "user-message" : "ai-message"}`;
  if (role === "user") {
    article.innerHTML = `<p>${escapeHtml(text)}</p>`;
  } else {
    const messageId = getAiMessageId(text);
    article.dataset.aiMessageId = messageId;
    article.dataset.aiMessageText = text;
    article.innerHTML = `
      <div class="ai-message-stack">
        <div class="message-body rich-text">${renderRichText(text)}</div>
        ${renderAiMessageActions(messageId)}
      </div>
    `;
  }
  aiThread.appendChild(article);
  refreshIcons();
  scrollAiThreadToBottom();
}

function clearThinkingState(element) {
  element?.classList.remove("shining-text");
}

function restoreAiMemory() {
  if (!aiThread) {
    return;
  }

  getRecentAiMemory().forEach((item) => appendAiMessage(item.role, item.text));
}

async function requestAiResponse(prompt, history = []) {
  const pending = aiThread?.querySelector("[data-ai-pending]");
  try {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt, history, mode: "debate" }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "AI request failed.");
    }
    if (pending) {
      const responseText = payload.text || "No response text returned.";
      const article = pending.closest(".ai-message");
      clearThinkingState(pending);
      pending.classList.add("rich-text");
      pending.innerHTML = renderRichText(responseText);
      if (article) {
        const messageId = getAiMessageId(responseText);
        article.dataset.aiMessageId = messageId;
        article.dataset.aiMessageText = responseText;
        const actions = article.querySelector(".ai-message-actions");
        if (actions) {
          actions.outerHTML = renderAiMessageActions(messageId);
        }
      }
      pending.removeAttribute("data-ai-pending");
      rememberAiMessage("user", prompt);
      rememberAiMessage("assistant", responseText);
    }
  } catch (error) {
    if (pending) {
      clearThinkingState(pending);
      pending.textContent = error.message || "AI is not available yet.";
      pending.removeAttribute("data-ai-pending");
    }
  }
  refreshIcons();
  scrollAiThreadToBottom();
}

async function requestVerseAiResponse(question) {
  const pending = verseAiThread?.querySelector("[data-verse-ai-pending]");
  try {
    const response = await fetch("/api/ai/verse", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        question,
        reference: verseAiContextData.reference,
        version: verseAiContextData.version,
        text: verseAiContextData.text,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Verse AI request failed.");
    }
    if (pending) {
      const responseText = payload.text || "No response text returned.";
      const article = pending.closest(".ai-message");
      clearThinkingState(pending);
      pending.classList.add("rich-text");
      pending.innerHTML = renderRichText(`**${verseAiContextData.reference}**\n\n${responseText}`);
      if (article) {
        const fullText = `${verseAiContextData.reference}\n\n${responseText}`;
        const messageId = getAiMessageId(fullText);
        article.dataset.aiMessageId = messageId;
        article.dataset.aiMessageText = fullText;
        const actions = article.querySelector(".ai-message-actions");
        if (actions) {
          actions.outerHTML = renderAiMessageActions(messageId);
        }
      }
      pending.removeAttribute("data-verse-ai-pending");
    }
  } catch (error) {
    if (pending) {
      clearThinkingState(pending);
      pending.textContent = error.message || "Verse AI is not available yet.";
      pending.removeAttribute("data-verse-ai-pending");
    }
  }
  refreshIcons();
  scrollVerseAiThreadToBottom();
}

function resetAiChat() {
  if (!aiThread) {
    return;
  }

  startNewAiConversation();
  aiThread.innerHTML = `
    <article class="message ai-message">
      <div class="ai-message-stack">
        <div class="message-body rich-text"><p>Ask me about a verse, doctrine, original language, cross references, or biblical context.</p></div>
      </div>
    </article>
  `;
  refreshIcons();
}

function handleAiSubmit(event) {
  event.preventDefault();
  const prompt = aiComposerInput?.value.trim();
  if (!prompt) {
    return;
  }

  const history = getRecentAiMemory();
  aiComposerInput.value = "";
  startAiComposerPromptRotation();
  resizeAiComposerInput();
  appendAiMessage("user", prompt);
  appendAiMessage("ai", "Brother AI is thinking...");
  const pending = aiThread.querySelector(".ai-message:last-child .message-body");
  pending?.setAttribute("data-ai-pending", "");
  pending?.classList.add("shining-text");
  requestAiResponse(prompt, history);
}

async function copyAiMessage(button) {
  const article = button.closest("[data-ai-message-id]");
  const text = article?.dataset.aiMessageText?.trim();
  if (!text) {
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    triggerAiActionAnimation(button, "is-success");
    setFeedback("AI response copied.");
  } catch {
    setFeedback("Copy is not available in this browser.");
  }
}

function toggleAiBookmark(button) {
  const article = button.closest("[data-ai-message-id]");
  const messageId = article?.dataset.aiMessageId;
  const text = article?.dataset.aiMessageText?.trim();
  if (!messageId || !text) {
    return;
  }

  if (savedState.aiBookmarks[messageId]) {
    delete savedState.aiBookmarks[messageId];
    article.querySelector(".ai-bookmark-picker")?.remove();
    button.classList.remove("is-active");
    triggerAiActionAnimation(button, "is-success");
    setFeedback("AI bookmark removed.");
  } else {
    savedState.aiBookmarks[messageId] = {
      id: messageId,
      text,
      folderId: "",
      createdAt: new Date().toISOString(),
    };
    button.classList.add("is-active");
    triggerAiActionAnimation(button, "is-success");
    setFeedback("AI response bookmarked.");
  }

  writeJson(aiBookmarksKey, savedState.aiBookmarks);
  if (savedState.aiBookmarks[messageId]) {
    showAiBookmarkPicker(button);
  }
}

function showAiBookmarkPicker(button, selectedFolderId = null) {
  const article = button.closest("[data-ai-message-id]");
  const messageId = article?.dataset.aiMessageId;
  const bookmark = messageId ? savedState.aiBookmarks[messageId] : null;
  if (!article || !bookmark) return;

  article.querySelector(".ai-bookmark-picker")?.remove();
  const options = [
    '<option value="">No tag</option>',
    ...getSavedFolders("bookmarks").map((folder) => `<option value="${escapeAttr(folder.id)}">${escapeHtml(folder.name)}</option>`),
  ].join("");
  const picker = document.createElement("div");
  picker.className = "ai-bookmark-picker";
  picker.innerHTML = `
      <label>Tag
        <select data-ai-bookmark-folder>${options}</select>
      </label>
      <form data-ai-bookmark-folder-form>
        <input name="folder" placeholder="New tag" aria-label="New bookmark tag" />
        <button type="submit" aria-label="Create tag">+</button>
      </form>
      <button type="button" class="ai-bookmark-done" data-ai-bookmark-folder-done aria-label="Validate tag" title="Save tag">✓</button>
  `;
  article.querySelector(".ai-message-actions")?.append(picker);
  const select = picker.querySelector("[data-ai-bookmark-folder]");
  select.value = selectedFolderId === null ? (bookmark.folderId || "") : selectedFolderId;
  picker.querySelector("[data-ai-bookmark-folder-done]")?.addEventListener("click", () => {
    bookmark.folderId = select.value;
    writeJson(aiBookmarksKey, savedState.aiBookmarks);
    picker.remove();
    setFeedback(`AI bookmark filed in ${getFolderName("bookmarks", select.value)}.`);
  });
  picker.querySelector("[data-ai-bookmark-folder-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = event.currentTarget.elements.folder.value.trim();
    const folderId = createSavedFolder("bookmarks", name, { renderProfile: false });
    if (!folderId) return;
    bookmark.folderId = folderId;
    writeJson(aiBookmarksKey, savedState.aiBookmarks);
    showAiBookmarkPicker(button, folderId);
    setFeedback(`AI bookmark filed in ${getFolderName("bookmarks", folderId)}.`);
  });
}

function triggerAiActionAnimation(button, effectClass) {
  if (!button) {
    return;
  }

  button.classList.remove("is-animating", "is-success");
  void button.offsetWidth;
  button.classList.add("is-animating");
  if (effectClass) {
    button.classList.add(effectClass);
  }

  window.clearTimeout(Number(button.dataset.animationTimer || 0));
  button.dataset.animationTimer = String(window.setTimeout(() => {
    button.classList.remove("is-animating", "is-success");
    delete button.dataset.animationTimer;
  }, 380));
}

function renderAiMessageActions(messageId) {
  const bookmarked = Boolean(savedState.aiBookmarks[messageId]);
  return `
    <div class="ai-message-actions">
      <button type="button" class="ai-action-button" data-ai-action="copy" aria-label="Copier la réponse" title="Copier">
        <i data-lucide="copy"></i>
      </button>
      <button type="button" class="ai-action-button${bookmarked ? " is-active" : ""}" data-ai-action="bookmark" aria-label="Bookmark la réponse" title="Bookmark">
        <i data-lucide="bookmark"></i>
      </button>
    </div>
  `;
}

function getAiMessageId(text) {
  const source = String(text || "").trim();
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = ((hash << 5) - hash + source.charCodeAt(index)) | 0;
  }
  return `ai-${Math.abs(hash).toString(36)}`;
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
    const response = await fetch(`/api/original-language?${params.toString()}`);
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

function getSavedSource(type) {
  return type === "highlights" ? savedState.highlights : savedState.bookmarks;
}

function writeSavedSource(type) {
  writeJson(type === "highlights" ? "brother.highlights" : "brother.bookmarks", getSavedSource(type));
}

function getSavedFolders(type) {
  if (type === "ai-bookmarks") {
    type = "bookmarks";
  }
  if (!Array.isArray(savedFolders[type])) {
    savedFolders[type] = [];
  }
  return savedFolders[type];
}

function writeSavedFolders() {
  writeJson("brother.savedFolders", savedFolders);
}

function getFolderName(type, folderId) {
  if (!folderId) {
    return "No folder";
  }
  return getSavedFolders(type).find((folder) => folder.id === folderId)?.name || "No folder";
}

function createSavedFolder(type, name, options = {}) {
  const { renderProfile = true } = options;
  const cleanName = name.trim().replace(/\s+/g, " ");
  if (!cleanName) {
    return "";
  }

  const folders = getSavedFolders(type);
  const existing = folders.find((folder) => folder.name.toLowerCase() === cleanName.toLowerCase());
  if (existing) {
    if (renderProfile) {
      activeProfileFolders[type] = existing.id;
      renderProfileSavedPanel(type);
    }
    return existing.id;
  }

  const folder = {
    id: `folder-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: cleanName,
  };
  folders.push(folder);
  writeSavedFolders();
  if (renderProfile) {
    activeProfileFolders[type] = folder.id;
    renderProfileSavedPanel(type);
  }
  return folder.id;
}

function assignSavedFolder(type, storageKey, folderId) {
  if (type === "ai-bookmarks") {
    const bookmark = savedState.aiBookmarks[storageKey];
    if (!bookmark) return;
    bookmark.folderId = folderId || "";
    writeJson(aiBookmarksKey, savedState.aiBookmarks);
    refreshProfilePanel();
    return;
  }
  const source = getSavedSource(type);
  if (!source[storageKey]) {
    return;
  }

  source[storageKey].folderId = folderId || "";
  writeSavedSource(type);
  refreshProfilePanel();
}

function bindFolderSelectInteractions(container) {
  container?.querySelectorAll(".saved-folder-select").forEach((label) => {
    const select = label.querySelector("select");
    if (!select) return;
    label.addEventListener("click", (event) => {
      if (event.target === select) return;
      event.preventDefault();
      if (typeof select.showPicker === "function") {
        select.showPicker();
      } else {
        select.focus();
      }
    });
  });
}

let activeSavedFolderPopover = null;

function closeSavedFolderPopover() {
  activeSavedFolderPopover?.remove();
  activeSavedFolderPopover = null;
}

function openSavedFolderPopover(trigger) {
  closeSavedFolderPopover();
  const type = trigger.dataset.savedFolderType;
  const storageKey = trigger.dataset.savedFolderKey;
  if (!type || !storageKey) return;

  const currentFolder = trigger.dataset.savedFolderCurrent || "";
  const folders = getSavedFolders(type);
  const modal = document.createElement("div");
  modal.className = "saved-folder-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  const popover = document.createElement("div");
  popover.className = "saved-folder-popover";
  popover.setAttribute("role", "document");
  popover.innerHTML = `
    <strong>Move to folder</strong>
    <button type="button" data-folder-choice="" class="${currentFolder ? "" : "is-active"}" role="menuitem">No folder</button>
    ${folders.map((folder) => `
      <button type="button" data-folder-choice="${escapeAttr(folder.id)}" class="${currentFolder === folder.id ? "is-active" : ""}" role="menuitem">
        ${escapeHtml(folder.name)}
      </button>
      `).join("")}
  `;
  modal.appendChild(popover);
  document.body.appendChild(modal);
  activeSavedFolderPopover = modal;
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeSavedFolderPopover();
  });

  popover.querySelectorAll("[data-folder-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      assignSavedFolder(type, storageKey, button.dataset.folderChoice || "");
      closeSavedFolderPopover();
      refreshHomeLibraryPanel();
    });
  });
}

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-saved-folder-trigger]");
  if (!trigger || !trigger.closest("[data-react-home-library-panel-root]")) return;
  event.stopPropagation();
  openSavedFolderPopover(trigger);
});

function bindSavedFolderTriggers(container) {
  container?.querySelectorAll("[data-saved-folder-trigger]").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      openSavedFolderPopover(trigger);
    });
  });
}

function getSavedRows(type, folderId = activeProfileFolders[type] || "") {
  const source = type === "highlights" ? savedState.highlights : savedState.bookmarks;
  return Object.entries(source)
    .map(([storageKey, item]) => ({ ...item, storageKey }))
    .filter((item) => item?.bookId && item?.chapter && item?.number)
    .filter((item) => !folderId || (folderId === "unfiled" ? !item.folderId : item.folderId === folderId))
    .sort((a, b) => String(b.createdAt || b.updatedAt || "").localeCompare(String(a.createdAt || a.updatedAt || "")));
}

function getSavedNoteRows() {
  const groups = new Map();
  Object.values(savedState.notes)
    .filter((note) => note?.key && (note.noteHtml || note.note))
    .forEach((note) => {
      const groupId = note.noteGroupId || note.key;
      const group = groups.get(groupId) || {
        id: groupId,
        items: [],
        note: note.note || "",
        title: note.noteTitle || "",
        noteHtml: note.noteHtml || "",
        noteFontSize: note.noteFontSize || 17,
        updatedAt: note.updatedAt || "",
      };
      group.items.push({ ...note });
      if (String(note.updatedAt || "") > String(group.updatedAt || "")) {
        group.updatedAt = note.updatedAt;
      }
      if (!group.title && note.noteTitle) group.title = note.noteTitle;
      groups.set(groupId, group);
    });
  return [...groups.values()].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

function refreshProfilePanel() {
  if (activeProfileView) {
    renderProfileSavedPanel(activeProfileView);
  }
}

function closeProfileSavedPanel() {
  activeProfileView = "";
  profileViewButtons.forEach((button) => button.classList.remove("is-active"));
  if (profileSavedPanel) {
    profileSavedPanel.hidden = true;
    profileSavedPanel.innerHTML = "";
  }
}

function setProfileTab(tab) {
  document.querySelectorAll("[data-profile-tab]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.profileTab === tab);
  });
  document.dispatchEvent(new CustomEvent("profile:tab-active", { detail: { tab } }));

  if (profileSettingsPanel) {
    profileSettingsPanel.hidden = false;
    document.querySelectorAll("[data-profile-section]").forEach((section) => {
      section.hidden = section.dataset.profileSection !== tab;
    });
  }

  closeProfileSavedPanel();
}

function renderProfileSavedPanel(type) {
  if (!profileSavedPanel) {
    return;
  }

  activeProfileView = type;
  profileViewButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.profileView === type);
  });

  if (type === "notes") {
    const rows = getSavedNoteRows();
    profileSavedPanel.hidden = false;
    profileSavedPanel.innerHTML = `
      <div class="saved-panel-title">
        <h3>Notes</h3>
        <span>${rows.length}</span>
      </div>
      <label class="saved-notes-search">
        <i data-lucide="search"></i>
        <input type="search" data-notes-search placeholder="Search notes..." aria-label="Search notes" />
      </label>
      ${rows.length ? rows.map((row, index) => `
        <article class="saved-note-card" data-note-searchable="${escapeAttr(`${row.title || "Untitled note"} ${row.items.map((item) => item.reference || "").join(" ")} ${row.note || ""}`.toLowerCase())}">
          <button class="saved-note-open" data-saved-note="${index}">
            <strong class="saved-note-card-title">${escapeHtml(row.title || "Untitled note")}</strong>
            <span class="saved-note-card-heading">
              <i data-lucide="notebook-pen"></i>
              <strong>${row.items.length} verse${row.items.length === 1 ? "" : "s"}</strong>
            </span>
            <span class="saved-note-references">${row.items.map((item) => escapeHtml(item.reference || "")).join(" · ")}</span>
            <p>${escapeHtml(row.note || "No preview available")}</p>
          </button>
        </article>
      `).join("") : '<p class="saved-empty">No notes yet. Create a note from the Bible tab and it will appear here.</p>'}
    `;
    profileSavedPanel.querySelector("[data-notes-search]")?.addEventListener("input", (event) => {
      const query = event.target.value.trim().toLowerCase();
      profileSavedPanel.querySelectorAll("[data-note-searchable]").forEach((card) => {
        card.hidden = Boolean(query) && !card.dataset.noteSearchable.includes(query);
      });
    });
    profileSavedPanel.querySelectorAll("[data-saved-note]").forEach((button) => {
      button.addEventListener("click", () => openSavedNote(rows[Number(button.dataset.savedNote)]));
    });
    refreshIcons();
    return;
  }

  const folders = getSavedFolders(type);
  const activeFolder = activeProfileFolders[type] || "";
  const rows = getSavedRows(type, activeFolder);
  const aiRows = type === "bookmarks"
    ? Object.values(savedState.aiBookmarks)
      .filter((item) => !activeFolder || (activeFolder === "unfiled" ? !item.folderId : item.folderId === activeFolder))
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
    : [];
  const totalRows = getSavedRows(type, "").length + (type === "bookmarks" ? Object.keys(savedState.aiBookmarks).length : 0);
  const title = type === "highlights" ? "Highlights" : "Bookmarks";
  const empty = type === "highlights"
    ? "No highlights yet. Highlight a verse from the Bible tab and it will appear here."
    : "No bookmarks yet. Bookmark a verse from the Bible tab and it will appear here.";
  const folderEmpty = activeFolder
    ? `No saved verses in ${getFolderName(type, activeFolder)} yet.`
    : empty;
  const folderOptions = [
    '<option value="">No folder</option>',
    ...folders.map((folder) => `<option value="${escapeAttr(folder.id)}">${escapeHtml(folder.name)}</option>`),
  ].join("");

  profileSavedPanel.hidden = false;
  profileSavedPanel.innerHTML = `
    <div class="saved-panel-title">
      <h3>${title}</h3>
      <span>${totalRows}</span>
    </div>
    <div class="saved-folder-tools">
      <div class="saved-folder-chips" aria-label="${title} folders">
        <button class="${activeFolder === "" ? "is-active" : ""}" data-folder-filter="">All</button>
        <button class="${activeFolder === "unfiled" ? "is-active" : ""}" data-folder-filter="unfiled">No folder</button>
        ${folders.map((folder) => `
          <button class="${activeFolder === folder.id ? "is-active" : ""}" data-folder-filter="${escapeAttr(folder.id)}">${escapeHtml(folder.name)}</button>
        `).join("")}
      </div>
      <form class="saved-folder-form" data-folder-form>
        <input type="text" name="folder" placeholder="New folder" aria-label="New folder name" />
        <button aria-label="Create folder"><i data-lucide="plus"></i></button>
      </form>
    </div>
    ${
      rows.length || aiRows.length
        ? `${rows.map((row, index) => `
            <article class="saved-verse-row">
              <button class="saved-verse-open" data-saved-row="${index}">
                ${type === "highlights" ? `<span class="saved-color-dot" style="--saved-color: ${escapeAttr(row.colorValue || "var(--beige)")}" aria-hidden="true"></span>` : '<i data-lucide="bookmark"></i>'}
                <span>
                  <strong>${escapeHtml(row.reference || `${row.bookId} ${row.chapter}:${row.number}`)}</strong>
                  <small>${escapeHtml(row.version || "")}</small>
                  <p>${escapeHtml(row.text || "")}</p>
                </span>
              </button>
              <button class="saved-folder-trigger" type="button" data-saved-folder-trigger data-saved-folder-type="${escapeAttr(type)}" data-saved-folder-key="${escapeAttr(row.storageKey)}" data-saved-folder-current="${escapeAttr(row.folderId || "")}" aria-label="Choose folder" title="Choose folder">
                <i data-lucide="folder"></i>
              </button>
            </article>
          `).join("")}
          ${aiRows.map((row) => `
            <article class="saved-ai-row">
              <div class="saved-ai-row-heading"><i data-lucide="sparkles"></i><strong>AI response</strong></div>
              <p>${escapeHtml(row.text || "")}</p>
              <button class="saved-folder-trigger" type="button" data-saved-folder-trigger data-saved-folder-type="ai-bookmarks" data-saved-folder-key="${escapeAttr(row.id)}" data-saved-folder-current="${escapeAttr(row.folderId || "")}" aria-label="Choose folder" title="Choose folder">
                <i data-lucide="folder"></i>
              </button>
            </article>
          `).join("")}`
        : `<p class="saved-empty">${folderEmpty}</p>`
    }
  `;

  profileSavedPanel.querySelector("[data-folder-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = event.currentTarget.elements.folder;
    const folderName = input.value.trim() || window.prompt("Folder name") || "";
    createSavedFolder(type, folderName);
    input.value = "";
  });
  profileSavedPanel.querySelectorAll("[data-folder-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      activeProfileFolders[type] = button.dataset.folderFilter;
      renderProfileSavedPanel(type);
    });
  });
  profileSavedPanel.querySelectorAll("[data-saved-row]").forEach((button) => {
    button.addEventListener("click", () => openSavedVerse(rows[Number(button.dataset.savedRow)]));
  });
  bindSavedFolderTriggers(profileSavedPanel);
  bindFolderSelectInteractions(profileSavedPanel);
  refreshIcons();
}

async function openSavedVerse(row) {
  if (!row) {
    return;
  }

  const matchingVersion = row.version
    ? readerState.versions.find((version) => version.abbreviation === row.version)
    : null;
  if (matchingVersion) {
    readerState.versionId = matchingVersion.id;
    renderVersionOptions();
  }

  readerState.bookId = row.bookId;
  readerState.chapter = Number(row.chapter);
  readerState.showHighlightsOnly = false;
  renderBookOptions();
  renderChapterOptions();
  setScreen("bible");
  await loadChapter();

  window.setTimeout(() => {
    const selector = row.highlightKey
      ? `[data-highlight-key="${CSS.escape(row.highlightKey)}"]`
      : `[data-verse-number="${CSS.escape(String(row.number))}"]`;
    const line = document.querySelector(selector);
    if (!line) {
      return;
    }
    document.querySelectorAll(".scripture-line.is-selected").forEach((item) => item.classList.remove("is-selected"));
    line.classList.add("is-selected");
    line.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 80);
}

async function openSavedNote(row) {
  const firstVerse = row?.items?.[0];
  if (!firstVerse) {
    return;
  }
  await openSavedVerse(firstVerse);
  window.setTimeout(() => {
    const line = document.querySelector(`[data-verse-key="${CSS.escape(firstVerse.key)}"]`)
      || document.querySelector(`[data-verse-number="${CSS.escape(String(firstVerse.number))}"]`);
    if (!line) {
      return;
    }
    selectedVerseData = getVerseDataFromElement(line);
    line.classList.add("is-selected");
    openRichNoteEditor();
  }, 180);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderInlineRichText(text) {
  let html = escapeHtml(text);
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?:;]|$)/g, "$1<em>$2</em>");
  return html;
}

function renderRichText(text) {
  const source = String(text || "").replace(/\r\n/g, "\n").trim();
  if (!source) {
    return "<p>No response text returned.</p>";
  }

  const lines = source.split("\n");
  const blocks = [];
  let paragraph = [];
  let quote = [];
  let listItems = [];
  let listType = "";
  let orderedListStart = 1;

  function flushParagraph() {
    if (!paragraph.length) return;
    blocks.push(`<p>${renderInlineRichText(paragraph.join(" "))}</p>`);
    paragraph = [];
  }

  function flushQuote() {
    if (!quote.length) return;
    const content = quote
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => `<p>${renderInlineRichText(entry)}</p>`)
      .join("");
    blocks.push(`<blockquote>${content}</blockquote>`);
    quote = [];
  }

  function flushList() {
    if (!listItems.length || !listType) return;
    const items = listItems.map((item) => `<li>${renderInlineRichText(item)}</li>`).join("");
    if (listType === "ol") {
      const startAttr = orderedListStart > 1 ? ` start="${orderedListStart}"` : "";
      blocks.push(`<ol${startAttr}>${items}</ol>`);
    } else {
      blocks.push(`<ul>${items}</ul>`);
    }
    listItems = [];
    listType = "";
    orderedListStart = 1;
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushQuote();
      flushList();
      continue;
    }

    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushQuote();
      flushList();
      const level = Math.min(4, headingMatch[1].length + 1);
      blocks.push(`<h${level}>${renderInlineRichText(headingMatch[2].trim())}</h${level}>`);
      continue;
    }

    const boldHeadingMatch = line.match(/^\*\*([^*]+)\*\*$/);
    if (boldHeadingMatch) {
      flushParagraph();
      flushQuote();
      flushList();
      blocks.push(`<h4>${renderInlineRichText(boldHeadingMatch[1].trim())}</h4>`);
      continue;
    }

    const orderedMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (orderedMatch) {
      flushParagraph();
      flushQuote();
      if (listType && listType !== "ol") flushList();
      if (!listItems.length) {
        orderedListStart = Number(orderedMatch[1]) || 1;
      }
      listType = "ol";
      listItems.push(orderedMatch[2].trim());
      continue;
    }

    const unorderedMatch = line.match(/^[-*]\s+(.+)$/);
    if (unorderedMatch) {
      flushParagraph();
      flushQuote();
      if (listType && listType !== "ul") flushList();
      listType = "ul";
      listItems.push(unorderedMatch[1].trim());
      continue;
    }

    const quoteMatch = line.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      quote.push(quoteMatch[1]);
      continue;
    }

    flushQuote();
    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushQuote();
  flushList();

  return blocks.join("");
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

document.querySelectorAll("[data-kids-book]").forEach((button) => {
  button.addEventListener("click", () => openKidsBibleBook(button.dataset.kidsBook));
});

document.querySelector("[data-kids-reader-back]")?.addEventListener("click", closeKidsBibleReader);
document.querySelector("[data-kids-first-page]")?.addEventListener("click", () => {
  kidsBibleState.page = 1;
  renderKidsBiblePage();
});
if (kidsBiblePageSelect) {
  kidsBiblePageSelect.addEventListener("change", () => {
    kidsBibleState.page = Number(kidsBiblePageSelect.value);
    renderKidsBiblePage();
  });
}
document.querySelector("[data-kids-previous]")?.addEventListener("click", () => {
  changeKidsBiblePage(-1);
});
document.querySelector("[data-kids-next]")?.addEventListener("click", () => {
  changeKidsBiblePage(1);
});

let kidsSwipeStartX = 0;
let kidsSwipeStartY = 0;
kidsBibleImageWrap?.addEventListener("touchstart", (event) => {
  const touch = event.touches[0];
  kidsSwipeStartX = touch?.clientX || 0;
  kidsSwipeStartY = touch?.clientY || 0;
}, { passive: true });
kidsBibleImageWrap?.addEventListener("touchend", (event) => {
  const touch = event.changedTouches[0];
  const deltaX = (touch?.clientX || 0) - kidsSwipeStartX;
  const deltaY = (touch?.clientY || 0) - kidsSwipeStartY;
  if (Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY)) return;
  changeKidsBiblePage(deltaX < 0 ? 1 : -1);
}, { passive: true });

document.querySelectorAll("[data-open-search]").forEach((button) => {
  button.addEventListener("click", () => showModal(searchPanel));
});

document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", closeModal);
});

if (aiForm) {
  aiForm.addEventListener("submit", handleAiSubmit);
}

if (aiComposerInput) {
  resizeAiComposerInput();
  startAiComposerPromptRotation();
  aiComposerInput.addEventListener("input", () => {
    resizeAiComposerInput();
    if (aiComposerInput.value.trim()) {
      stopAiComposerPromptRotation();
    } else {
      startAiComposerPromptRotation();
    }
  });
}

if (newAiChatButton) {
  newAiChatButton.addEventListener("click", resetAiChat);
}

aiTabs.forEach((button) => {
  button.addEventListener("click", () => setAiTab(button.dataset.aiTab));
});

if (verseAiForm) {
  verseAiForm.addEventListener("submit", handleVerseAiSubmit);
}

[aiThread, verseAiThread].forEach((thread) => {
  thread?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-ai-action]");
    if (!button) {
      return;
    }

    const action = button.dataset.aiAction;
    if (action === "copy") {
      copyAiMessage(button);
    }
    if (action === "bookmark") {
      toggleAiBookmark(button);
    }
  });
});

profileViewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    button.classList.add("is-pressed");
    window.setTimeout(() => button.classList.remove("is-pressed"), 180);
    if (activeProfileView === button.dataset.profileView && profileSavedPanel && !profileSavedPanel.hidden) {
      closeProfileSavedPanel();
      return;
    }
    renderProfileSavedPanel(button.dataset.profileView);
  });
});

document.addEventListener("profile:tab-change", (event) => {
  const tab = event.detail?.tab;
  if (["preferences", "information", "cloud"].includes(tab)) {
    setProfileTab(tab);
  }
});

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
  homeLibraryPanel.innerHTML = profileSavedPanel.innerHTML;
  profileSavedPanel.innerHTML = "";
  profileSavedPanel.hidden = true;
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

document.addEventListener("home:library-tab-change", (event) => {
  const tab = event.detail?.tab;
  if (["highlights", "bookmarks", "notes"].includes(tab)) {
    renderHomeLibraryTab(tab);
  }
});

window.homeTimelineBridge = {
  open(bookId) {
    if (!BOOKS.some((book) => book.id === bookId)) return;
    readerState.bookId = bookId;
    readerState.chapter = 1;
    setLocalValue("brother.book", bookId);
    setLocalValue("brother.chapter", "1");
    renderBookOptions();
    renderChapterOptions();
    setScreen("bible");
    loadChapter();
  },
};

window.homeLibraryBridge = {
  selectTab(tab) {
    if (!["highlights", "bookmarks", "notes"].includes(tab)) return;
    renderHomeLibraryTab(tab);
  },
  getSnapshot(tab = "notes") {
    const activeFolder = activeProfileFolders[tab] || "";
    const folders = tab === "notes" ? [] : getSavedFolders(tab).map((folder) => ({ ...folder }));
    const rows = tab === "notes" ? getSavedNoteRows() : getSavedRows(tab, activeFolder);
    const aiRows = tab === "bookmarks"
      ? Object.values(savedState.aiBookmarks)
        .filter((item) => !activeFolder || (activeFolder === "unfiled" ? !item.folderId : item.folderId === activeFolder))
        .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
        .map((item) => ({ ...item }))
      : [];
    return {
      tab,
      isConnected: Boolean(supabaseUser),
      activeFolder,
      folders,
      rows: rows.map((row) => ({ ...row, items: row.items?.map((item) => ({ ...item })) })),
      aiRows,
      totalRows: tab === "notes"
        ? rows.length
        : getSavedRows(tab, "").length + (tab === "bookmarks" ? Object.keys(savedState.aiBookmarks).length : 0),
    };
  },
  openSavedVerse,
  openSavedNote,
  setFolder(type, folderId) {
    activeProfileFolders[type] = folderId || "";
    document.dispatchEvent(new CustomEvent("home:library-data-change", { detail: { tab: type } }));
  },
  createFolder(type, name) {
    return createSavedFolder(type, name, { renderProfile: false });
  },
  renameFolder(type, folderId, name) {
    const cleanName = String(name || "").trim().replace(/\s+/g, " ");
    const folders = getSavedFolders(type);
    const folder = folders.find((item) => item.id === folderId);
    if (!folder || !cleanName || folders.some((item) => item.id !== folderId && item.name.toLowerCase() === cleanName.toLowerCase())) {
      return false;
    }
    folder.name = cleanName;
    writeSavedFolders();
    refreshProfilePanel();
    return true;
  },
  deleteFolder(type, folderId) {
    const folders = getSavedFolders(type);
    const index = folders.findIndex((item) => item.id === folderId);
    if (index < 0) return false;
    folders.splice(index, 1);
    const source = getSavedSource(type);
    Object.values(source).forEach((item) => {
      if (item.folderId === folderId) item.folderId = "";
    });
    writeSavedFolders();
    writeSavedSource(type);
    if (type === "bookmarks") {
      Object.values(savedState.aiBookmarks).forEach((item) => {
        if (item.folderId === folderId) item.folderId = "";
      });
      writeJson(aiBookmarksKey, savedState.aiBookmarks);
    }
    if (activeProfileFolders[type] === folderId) activeProfileFolders[type] = "";
    refreshProfilePanel();
    return true;
  },
};

renderHomeLibraryTab("notes");

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

multiSelectMenuToggle?.addEventListener("click", () => {
  if (!multiSelectMode || !multiSelectedVerseData.length) {
    return;
  }
  selectedVerseData = multiSelectedVerseData[0];
  selectedVerse.textContent = `${multiSelectedVerseData.length} verses selected`;
  sheetFeedback.textContent = "Choose an action to apply to the selected verses.";
  hideVerseDetail();
  syncVerseActionStates();
  showModal(verseSheet);
});

document.querySelectorAll(".tabs button").forEach((button) => {
  button.addEventListener("click", () => {
    button.parentElement.querySelectorAll("button").forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
  });
});

apologeticsTracks?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-apologetics-track]");
  if (!button) {
    return;
  }

  apologeticsOverviewState.featuredOpenTrackId = "";
  saveApologeticsOverview();
  apologeticsState.trackId = button.dataset.apologeticsTrack;
  apologeticsState.category = "all";
  apologeticsState.topicId = getApologeticsTrack()?.topics[0]?.id || "";
  apologeticsState.selectedTrackTopicId = "";
  saveApologeticsState();
  setScreen("apologetics-track");
});

apologeticsFilters?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-apologetics-filter]");
  if (!button) {
    return;
  }

  apologeticsOverviewState.featuredOpenTrackId = "";
  saveApologeticsOverview();
  apologeticsState.category = button.dataset.apologeticsFilter;
  const nextTopic = getApologeticsTopics()[0];
  if (nextTopic) {
    apologeticsState.topicId = nextTopic.id;
  }
  apologeticsState.selectedTrackTopicId = "";
  saveApologeticsState();
  renderApologetics();
});

apologeticsTopics?.addEventListener("click", (event) => {
  const featuredToggle = event.target.closest("[data-apologetics-featured-toggle]");
  if (featuredToggle) {
    const group = featuredToggle.closest("[data-apologetics-featured-group]");
    if (!group) {
      return;
    }

    const trackId = group.dataset.apologeticsFeaturedGroup || "";
    const nextTrackId = apologeticsOverviewState.featuredOpenTrackId === trackId ? "" : trackId;
    apologeticsOverviewState.featuredOpenTrackId = nextTrackId;
    saveApologeticsOverview();
    renderApologetics();
    refreshIcons();
    return;
  }

  const button = event.target.closest("[data-apologetics-topic]");
  if (!button) {
    return;
  }

  apologeticsOverviewState.featuredOpenTrackId = "";
  saveApologeticsOverview();
  apologeticsState.trackId = button.dataset.apologeticsTrackJump || apologeticsState.trackId;
  apologeticsState.category = "all";
  apologeticsState.topicId = button.dataset.apologeticsTopic;
  saveApologeticsState();
  setScreen("apologetics-topic");
});

apologeticsChallenge?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-apologetics-topic]");
  if (!button) {
    return;
  }

  apologeticsOverviewState.featuredOpenTrackId = "";
  saveApologeticsOverview();
  apologeticsState.trackId = button.dataset.apologeticsTrackJump || apologeticsState.trackId;
  apologeticsState.category = "all";
  apologeticsState.topicId = button.dataset.apologeticsTopic;
  saveApologeticsState();
  setScreen("apologetics-topic");
});

apologeticsTrackTopics?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-apologetics-topic]");
  if (!button) {
    return;
  }

  apologeticsOverviewState.featuredOpenTrackId = "";
  saveApologeticsOverview();
  apologeticsState.selectedTrackTopicId = apologeticsState.selectedTrackTopicId === button.dataset.apologeticsTopic
    ? ""
    : button.dataset.apologeticsTopic;
  saveApologeticsState();
  renderApologeticsTrackScreen();
});

apologeticsTrackQuick?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-apologetics-framework-step]");
  if (!button) {
    return;
  }

  const track = getApologeticsTrack();
  if (!track) {
    return;
  }

  apologeticsOverviewState.trackFrameworkOpen[track.id] = Number(button.dataset.apologeticsFrameworkStep);
  saveApologeticsOverview();
  renderApologeticsTrackScreen();
});

apologeticsBeginButton?.addEventListener("click", () => {
  const nextTopicId = apologeticsState.selectedTrackTopicId || apologeticsState.topicId || getApologeticsTopics()[0]?.id;
  if (!nextTopicId) {
    return;
  }

  apologeticsState.topicId = nextTopicId;
  saveApologeticsState();
  setScreen("apologetics-topic");
});

apologeticsDetail?.addEventListener("click", (event) => {
  const coachButton = event.target.closest("[data-apologetics-coach]");
  if (coachButton) {
    launchApologeticsCoach(coachButton.dataset.apologeticsCoach);
    return;
  }

  const copyButton = event.target.closest("[data-apologetics-copy]");
  if (copyButton) {
    copyApologeticsShortAnswer();
  }
});

document.querySelectorAll("[data-apologetics-back]").forEach((button) => {
  button.addEventListener("click", () => setScreen(button.dataset.apologeticsBack));
});

document.querySelectorAll("[data-apologetics-coach]").forEach((button) => {
  button.addEventListener("click", () => launchApologeticsCoach(button.dataset.apologeticsCoach));
});

document.querySelectorAll("[data-apologetics-room='debate']").forEach((button) => {
  button.addEventListener("click", () => setScreen("apologetics-debate"));
});

document.querySelectorAll("[data-apologetics-room='coach']").forEach((button) => {
  button.addEventListener("click", () => setScreen("apologetics-coach"));
});

document.querySelectorAll("[data-apologetics-copy]").forEach((button) => {
  button.addEventListener("click", copyApologeticsShortAnswer);
});

apologeticsTopicTabs?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-apologetics-topic-tab]");
  if (!button) {
    return;
  }

  apologeticsChatState.activeTopicView = button.dataset.apologeticsTopicTab;
  if (apologeticsChatState.activeTopicView === "chat") {
    const topic = getApologeticsTopic();
    if (topic) {
      markApologeticsTopicCompleted(topic.id);
    }
  }
  renderApologeticsTopicScreen();
});

apologeticsChatTabs?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-apologetics-chat-tab]");
  if (!button) {
    return;
  }

  apologeticsChatState.activeTab = button.dataset.apologeticsChatTab;
  renderApologeticsChat();
});

if (apologeticsChatInput) {
  resizeApologeticsChatInput();
  apologeticsChatInput.addEventListener("input", resizeApologeticsChatInput);
  apologeticsChatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      apologeticsChatForm?.requestSubmit();
    }
  });
}

if (apologeticsChatForm) {
  apologeticsChatForm.addEventListener("submit", handleApologeticsChatSubmit);
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modalLayer.hidden) {
    closeModal();
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    showModal(searchPanel);
  }
});

function persistNotesBeforeBackground() {
  if (noteEditorPanel?.classList.contains("is-visible")) {
    saveRichNote();
  }
  syncPendingState();
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    persistNotesBeforeBackground();
  } else {
    syncPendingState();
  }
});

document.addEventListener("click", (event) => {
  const searchButton = event.target.closest("[data-open-search]");
  if (searchButton) {
    showModal(searchPanel);
  }
});

window.addEventListener("pagehide", persistNotesBeforeBackground);

modalLayer.addEventListener("click", (event) => {
  if (event.target === modalLayer) {
    closeModal();
  }
});

window.addEventListener("load", refreshIcons);
appShell.dataset.activeScreen = document.querySelector(".screen.is-active")?.id || "home";
window.appNavigate = setScreen;
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
    bookName: book.name,
    sourceLabel: `${book.name} ${readerState.chapter} · ${readerState.parallelEnabled ? "Parallel" : `${getVersionLanguageFlag(version)} ${chapter?.versionName || version.name}`}`,
    copyright: chapter?.copyright || "",
    title: chapter?.title || "",
    parallelEnabled: readerState.parallelEnabled,
    showHighlightsOnly: readerState.showHighlightsOnly,
    verses: primaryVerses,
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

window.kidsBibleBridge = {
  getSnapshot() {
    const books = Object.entries(kidsBibleBooks).map(([id, book]) => {
      const page = id === kidsBibleState.bookId ? kidsBibleState.page : readKidsBiblePage(id);
      return {
        id,
        title: book.title,
        totalPages: book.totalPages,
        page,
        progress: Math.round((page / book.totalPages) * 100),
        previewSrc: getKidsBiblePagePath(1, id),
      };
    });
    const currentBook = books.find((book) => book.id === kidsBibleState.bookId) || books[0];
    return {
      reader: appShell.dataset.kidsReader === "true",
      bookId: currentBook.id,
      page: kidsBibleState.page,
      progress: Math.round((kidsBibleState.page / currentBook.totalPages) * 100),
      imageSrc: getKidsBiblePagePath(kidsBibleState.page, currentBook.id),
      currentBook,
      books,
    };
  },
  open(bookId) {
    openKidsBibleBook(bookId);
    emitKidsBibleChange();
  },
  close() {
    closeKidsBibleReader();
    emitKidsBibleChange();
  },
  setPage(page) {
    const book = getKidsBibleBook(kidsBibleState.bookId);
    kidsBibleState.page = Math.max(1, Math.min(book.totalPages, Number(page) || 1));
    renderKidsBiblePage();
    emitKidsBibleChange();
  },
  changePage(delta) {
    const book = getKidsBibleBook(kidsBibleState.bookId);
    const nextPage = kidsBibleState.page + Number(delta || 0);
    if (nextPage < 1 || nextPage > book.totalPages) return;
    kidsBibleState.page = nextPage;
    renderKidsBiblePage();
    emitKidsBibleChange();
  },
};
window.bibleReaderBridge = {
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
    readerState.chapter = Number(value);
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
window.noteEditorBridge = {
  attachContent(element) {
    noteEditorContent = element;
  },
  getContentHtml() {
    return noteEditorContent?.innerHTML || "<p><br></p>";
  },
  contentChanged(html) {
    if (noteEditorContent && noteEditorContent.innerHTML !== html) noteEditorContent.innerHTML = html;
    markNoteEditorDirty();
    captureNoteSelection();
    updateNoteToolbarColors();
    emitNoteEditorChange();
  },
  getSnapshot() {
    const textInput = document.querySelector("[data-note-color]");
    const highlightInput = document.querySelector("[data-note-highlight]");
    const element = getNoteCaretElement();
    const textColor = element ? window.getComputedStyle(element).color : (textInput?.value || "#ffffff");
    const backgroundColor = element ? getNoteHighlightColor(element) : (highlightInput?.value || "#facc15");
    return {
      textColor,
      highlightColor: backgroundColor === "transparent" ? (highlightInput?.value || "#facc15") : backgroundColor,
      fontSize: noteEditorFontSize,
    };
  },
  command(name, value = null) {
    noteEditorContent?.focus();
    document.execCommand(name, false, value);
    markNoteEditorDirty();
    updateNoteToolbarColors();
  },
  color(type, value) {
    const selector = type === "highlight" ? "[data-note-highlight]" : "[data-note-color]";
    const input = document.querySelector(selector);
    if (input) input.value = value;
    restoreNoteSelection();
    noteEditorContent?.focus();
    document.execCommand(type === "highlight" ? "hiliteColor" : "foreColor", false, value);
    captureNoteSelection();
    markNoteEditorDirty();
    updateNoteToolbarColors();
  },
  changeSize(delta) {
    changeNoteFontSize(delta);
    emitNoteToolbarChange();
  },
  getEditorSnapshot() {
    return {
      title: noteEditorNoteTitle,
      items: noteEditorVerseItems.map((item) => ({ ...item })),
      addingVerses: noteEditorAddingVerses,
    };
  },
  setTitle(value) {
    noteEditorNoteTitle = value;
    markNoteEditorDirty();
    emitNoteEditorChange();
  },
  save() {
    saveRichNote();
    resetNoteEditorDirty();
    emitNoteEditorChange();
  },
  delete() {
    deleteRichNote();
    emitNoteEditorChange();
  },
  close() {
    closeModal();
    emitNoteEditorChange();
  },
  startAdding() {
    startAddingNoteVerses();
    emitNoteEditorChange();
  },
  removeVerse(key) {
    removeNoteEditorVerse(key);
  },
};
window.profileBridge = {
  selectTab(tab) {
    if (!["preferences", "information", "cloud"].includes(tab)) return;
    setProfileTab(tab);
  },
  getHero() {
    return { displayName: savedProfile.displayName || defaultProfile.displayName, streakLabel: savedProfile.streakLabel || defaultProfile.streakLabel, coverImage: savedProfile.coverImage || defaultProfile.coverImage };
  },
  async prepareCover(file) {
    return compressProfileCover(file);
  },
  saveCover(coverImage) {
    savedProfile.coverImage = coverImage || defaultProfile.coverImage;
    saveProfile();
    applyProfile();
    document.dispatchEvent(new CustomEvent("profile:hero-change"));
  },
  getAuth() {
    return {
      connected: Boolean(supabaseUser),
      email: supabaseUser?.email || "",
      feedback: profileAuthBridgeFeedback || "Connect to sync your profile and app data across devices.",
    };
  },
  async submitAuth(mode, email, password, passwordConfirm) {
    if (!supabaseClient) {
      setAuthFeedback("Supabase is not configured yet.", true);
      return;
    }
    if (mode === "sign-up") {
      if (!passwordConfirm) {
        setAuthFeedback("Confirm your password to create the account.", true);
        return;
      }
      if (password !== passwordConfirm) {
        setAuthFeedback("Passwords do not match.", true);
        return;
      }
      const { error } = await supabaseClient.auth.signUp({ email, password });
      setAuthFeedback(error ? error.message : "Account created. Check your email if confirmation is enabled.", Boolean(error));
      return;
    }
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    setAuthFeedback(error ? error.message : "Signed in. Syncing your data...", Boolean(error));
  },
  async forgotPassword(email) {
    if (!supabaseClient) {
      setAuthFeedback("Supabase is not configured yet.", true);
      return;
    }
    if (!email) {
      setAuthFeedback("Enter your email first to reset your password.", true);
      return;
    }
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}${window.location.pathname}` });
    setAuthFeedback(error ? error.message : "Password reset email sent. Check your inbox.", Boolean(error));
  },
  async signOut() {
    await supabaseClient?.auth.signOut();
    sessionStorage.removeItem("brother.supabaseHydratedUser");
    setAuthFeedback("Signed out. The app is now local-only.");
  },
  getInfo() {
    return {
      displayName: savedProfile.displayName || "",
      country: savedProfile.country || "",
      dateOfBirth: savedProfile.dateOfBirth || "",
    };
  },
  saveInfo(info) {
    savedProfile.displayName = String(info.displayName || "").trim() || defaultProfile.displayName;
    savedProfile.country = String(info.country || "").trim();
    savedProfile.dateOfBirth = String(info.dateOfBirth || "").trim();
    saveProfile();
    applyProfile();
    document.dispatchEvent(new CustomEvent("profile:info-change"));
    document.dispatchEvent(new CustomEvent("profile:hero-change"));
  },
  getPreferences() {
    return {
      background: savedPreferences.background,
      textSize: savedPreferences.textSize,
      accent: savedPreferences.accent,
      textSizes: Object.keys(textSizeOptions),
      accents: Object.keys(accentOptions),
    };
  },
  setPreference(type, value) {
    if (type === "background") savedPreferences.background = value;
    if (type === "textSize" && textSizeOptions[value]) savedPreferences.textSize = value;
    if (type === "accent" && accentOptions[value]) savedPreferences.accent = value;
    savePreferences();
    applyPreferences();
    if (type === "background") centerBackgroundOption(savedPreferences.background);
    document.dispatchEvent(new CustomEvent("profile:preferences-change"));
  },
};
window.prayerBridge = {
  getSnapshot() {
    const currentPrayerUserId = supabaseUser?.id || prayerUserId;
    const requests = prayerState.requests
      .filter((request) => {
        if (prayerState.pageTab === "request") {
          const isOwnRequest = supabaseClient ? request.ownerId === supabaseUser?.id : true;
          if (!isOwnRequest) return false;
        }
        if (prayerState.pageTab === "board") {
          return prayerState.filter === "all" || (request.category || "general") === prayerState.filter;
        }
        return true;
      })
      .sort((a, b) => {
        if (prayerState.sort === "recent") return String(b.createdAt).localeCompare(String(a.createdAt));
        const difference = prayerState.sort === "least" ? a.prayerCount - b.prayerCount : b.prayerCount - a.prayerCount;
        return difference || String(b.createdAt).localeCompare(String(a.createdAt));
      })
      .map((request) => ({
        ...request,
        preview: getPrayerPreview(request.text),
        hasPrayed: request.prayedBy?.includes(currentPrayerUserId),
        isNewlyPrayed: request.prayedBy?.includes(currentPrayerUserId) && request.prayerCount === 1,
        backgroundIndex: getPrayerBackgroundIndex(request),
      }));
    return {
      pageTab: prayerState.pageTab,
      filter: prayerState.filter,
      sort: prayerState.sort,
      myWallExpanded: prayerState.myWallExpanded,
      requestCategory: prayerCategory?.value || "general",
      backgroundIndex: selectedPrayerBackgroundIndex,
      feedback: prayerBridgeFeedback || prayerFeedback?.textContent || "",
      sent: prayerBridgeSent,
      requests,
    };
  },
  setPageTab(tab) {
    prayerState.pageTab = tab === "request" ? "request" : "board";
    if (prayerState.pageTab === "request") startPrayerPromptRotation();
    else stopPrayerPromptRotation();
    renderPrayerPage();
  },
  setFilter(filter) {
    prayerState.filter = ["all", "general", "family", "health", "work", "faith", "other"].includes(filter) ? filter : "all";
    renderPrayerPage();
  },
  setSort(sort) {
    prayerState.sort = ["most", "least", "recent"].includes(sort) ? sort : "most";
    renderPrayerPage();
  },
  toggle(requestId) {
    const request = prayerState.requests.find((item) => item.id === requestId);
    if (!request) return;
    request.expanded = !request.expanded;
    renderPrayerPage();
  },
  async share(requestId) {
    const request = prayerState.requests.find((item) => item.id === requestId);
    if (!request) return;
    const shareText = `Prayer request: ${request.text}`;
    try {
      if (navigator.share) await navigator.share({ title: "Prayer request", text: shareText });
      else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setPrayerBridgeFeedback("Prayer request copied to your clipboard.");
      }
    } catch (error) {
      if (error?.name !== "AbortError") setPrayerBridgeFeedback("This request could not be shared.");
    }
  },
  async pray(requestId) {
    const request = prayerState.requests.find((item) => item.id === requestId);
    if (!request) return;
    if (supabaseClient && !supabaseUser) {
      setPrayerBridgeFeedback("Sign in to record your prayer.");
      return;
    }
    if (supabaseClient && supabaseUser) {
      const { error } = await supabaseClient.rpc("pray_for_request", { request_uuid: request.id });
      if (error) {
        setPrayerBridgeFeedback(error.message);
        return;
      }
      await loadPrayerFromSupabase();
      return;
    }
    request.prayedBy ||= [];
    if (request.prayedBy.includes(prayerUserId)) return;
    request.prayedBy.push(prayerUserId);
    request.prayerCount += 1;
    savePrayerRequests();
    renderPrayerPage();
  },
  setCategory(category) {
    setPrayerCategory(category);
    emitPrayerStateChange();
  },
  async submit(text, category, backgroundIndex) {
    const cleanText = String(text || "").trim();
    const wordCount = countPrayerWords(cleanText);
    const moderationMessage = getPrayerModerationMessage(cleanText);
    if (!cleanText || wordCount > 300) {
      setPrayerBridgeFeedback(wordCount > 300 ? "Please keep your request under 300 words." : "Write a prayer request first.");
      return false;
    }
    if (moderationMessage) {
      setPrayerBridgeFeedback(moderationMessage);
      return false;
    }
    if (supabaseClient && !supabaseUser) {
      setPrayerBridgeFeedback("Sign in to share a prayer request with the community.");
      return false;
    }
    if (supabaseClient && supabaseUser) {
      const created = await createPrayerRequest(cleanText, category, false, backgroundIndex);
      if (!created) return false;
    } else {
      prayerState.requests.unshift({
        id: `prayer-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ownerId: prayerUserId,
        text: cleanText,
        prayerCount: 0,
        prayedBy: [],
        createdAt: new Date().toISOString(),
        category,
        urgent: false,
        backgroundIndex,
        status: "active",
      });
      savePrayerRequests();
    }
    setPrayerCategory("general");
    selectedPrayerBackgroundIndex = 0;
    prayerState.pageTab = "request";
    prayerState.myWallExpanded = true;
    prayerState.filter = "all";
    prayerBridgeFeedback = "Your request was shared anonymously.";
    prayerBridgeSent = true;
    window.setTimeout(() => {
      prayerBridgeSent = false;
      emitPrayerStateChange();
    }, 1800);
    renderPrayerPage();
    return true;
  },
};
window.aiBridge = {
  getSnapshot() {
    const memory = getRecentAiMemory();
    const messages = memory.length ? memory.map((item) => ({ ...item })) : [{ role: "assistant", text: "Ask me about a verse, doctrine, original language, cross references, or biblical context." }];
    const histories = readJson(aiConversationsKey, [])
      .filter((item) => Date.now() - Number(item.updatedAt || item.createdAt || 0) < aiMemoryTtlMs)
      .sort((a, b) => Number(b.updatedAt || b.createdAt) - Number(a.updatedAt || a.createdAt))
      .map((conversation) => {
        const firstUser = conversation.messages?.find((message) => message.role === "user");
        const preview = firstUser?.text || "New conversation";
        return { id: conversation.id, preview: preview.length > 30 ? `${preview.slice(0, 30).trim()}...` : preview };
      });
    return { tab: "chat", messages, histories };
  },
  format(text) {
    return renderRichText(text);
  },
  messageId(text) {
    return getAiMessageId(text);
  },
  bookmarked(text) {
    return Boolean(savedState.aiBookmarks[getAiMessageId(text)]);
  },
  async send(prompt, history = []) {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt, history }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "AI request failed.");
    const responseText = payload.text || "No response text returned.";
    rememberAiMessage("user", prompt);
    rememberAiMessage("assistant", responseText);
    document.dispatchEvent(new CustomEvent("ai:state-change"));
    return responseText;
  },
  async sendDebate(prompt, history = []) {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt, history, mode: "debate" }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "AI request failed.");
    return payload.text || "No response text returned.";
  },
  async sendCoach(prompt, history = []) {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt, history, mode: "coach" }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "AI request failed.");
    return payload.text || "No response text returned.";
  },
  async evaluateDebate(prompt) {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt, history: [], mode: "evaluation" }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "AI evaluation failed.");
    return payload.text || "{}";
  },
  getDebateXp() {
    return Math.max(0, Number(readJson(debateXpKey, 0)) || 0);
  },
  addDebateXp(amount) {
    const nextXp = this.getDebateXp() + Math.max(0, Number(amount) || 0);
    writeJson(debateXpKey, nextXp);
    document.dispatchEvent(new CustomEvent("debate:xp-change"));
    return nextXp;
  },
  newConversation() {
    currentAiConversationId = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    localStorage.setItem("brother.aiConversationId", currentAiConversationId);
    clearAiMemory();
    document.dispatchEvent(new CustomEvent("ai:state-change"));
  },
  loadConversation(id) {
    const conversation = readJson(aiConversationsKey, []).find((item) => item.id === id);
    if (!conversation) return null;
    currentAiConversationId = id;
    localStorage.setItem("brother.aiConversationId", id);
    writeJson(aiMemoryKey, conversation.messages || []);
    return (conversation.messages || []).map((item) => ({ ...item }));
  },
  async copy(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard access is optional on mobile browsers.
    }
  },
  bookmark(text) {
    const messageId = getAiMessageId(text);
    if (savedState.aiBookmarks[messageId]) delete savedState.aiBookmarks[messageId];
    else savedState.aiBookmarks[messageId] = { id: messageId, text, folderId: "", createdAt: new Date().toISOString() };
    writeJson(aiBookmarksKey, savedState.aiBookmarks);
    document.dispatchEvent(new CustomEvent("ai:state-change"));
    document.dispatchEvent(new CustomEvent("home:library-data-change", { detail: { tab: "bookmarks" } }));
  },
};
initHomeStats();
initAuthForm();
initSupabase();
restoreAiMemory();
renderApologetics();
refreshIcons();
