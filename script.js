

document.addEventListener("pointerdown", (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("button, [role='button'], [role='tab']");
  if (!button || button.matches(":disabled") || button.getAttribute("aria-disabled") === "true") return;
  if (button.closest(".haptics-strength-control")) return;
  // Cards can use button semantics for accessibility without being haptic controls.
  const isCard = [...button.classList].some((name) => /(?:^|-)(?:card|tile)(?:-|$)/.test(name));
  if (isCard || button.matches(".saved-note-open, .saved-verse-open, .apologetics-room-button, .apologetics-debate-progress-main")) return;
  if (!button.matches("button, [role='tab']")) return;
  window.appButtonHaptic?.();
}, true);

const screens = [...document.querySelectorAll("[data-screen]")];
const navButtons = [...document.querySelectorAll("[data-nav]")];
const activeScreenStorageKey = "think-bible.active-screen";
const homeMenuToggle = document.querySelector("[data-home-menu-toggle]");
const homeMenuLayer = document.querySelector("[data-home-menu-layer]");
const homeMenuDrawer = document.querySelector("[data-home-menu-drawer]");
const homeMenuCloseButtons = [...document.querySelectorAll("[data-home-menu-close]")];
const homeMenuNavigationButtons = [...document.querySelectorAll("[data-home-menu-drawer] [data-nav]")];
let homeMenuLastFocusedElement = null;
const appShell = document.querySelector(".app-shell");
const modalLayer = document.querySelector("[data-modal-layer]");
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
const aiMemoryKey = "brother.aiMemory";
const aiConversationsKey = "brother.aiConversations";
const aiBookmarksKey = "brother.aiBookmarks";
const apologeticsChatKey = "brother.apologeticsChat";
const apologeticsProgressKey = "brother.apologeticsProgress";
const debateXpKey = "brother.debateXp";
const pendingSyncKey = "app.pendingSync";
const aiMemoryTtlMs = 24 * 60 * 60 * 1000;
const maxAiMemoryMessages = 24;
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
const profileName = document.querySelector("[data-profile-name]");
const profileStreak = document.querySelector("[data-profile-streak]");
const profileForm = document.querySelector("[data-profile-form]");
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
const homeContinueReading = document.querySelector("[data-home-continue-reading]");
const homePrayerCount = document.querySelector("[data-home-prayer-count]");
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
  ? storedPrayerRequests
    .filter((request) => !request.demo)
    .map((request) => request.status === "pending" ? { ...request, status: "active" } : request)
  : [];
if (JSON.stringify(cleanedPrayerRequests) !== JSON.stringify(Array.isArray(storedPrayerRequests) ? storedPrayerRequests : [])) {
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
let prayerModerator = false;
const moderationReportsKey = "brother.moderationReports";
let moderationReports = readJson(moderationReportsKey, []);
let moderationAdminUnlocked = false;

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
let remoteBibleVersions = [];
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
  displayName: "",
  coverImage: "assets/home-hero-mountain-sunrise.webp",
  email: "",
  country: "",
  dateOfBirth: "",
  avatarInitials: "",
  bio: "",
  streakLabel: "",
  accountId: "",
  authStatus: "Local profile",
  storageStatus: "Local only",
};
const profileCoverCatalog = [
  { id: "mountain-sunrise", label: "Mountain sunrise", src: "assets/home-hero-mountain-sunrise.webp" },
  { id: "community", label: "Community", src: "assets/home-hero-community.webp" },
  { id: "forest", label: "Forest", src: "assets/home-card-forest.webp" },
  { id: "prayer", label: "Prayer", src: "assets/home-card-prayer.webp" },
  { id: "sunlit-path", label: "Sunlit path", src: "assets/prayer-backgrounds/prayer-1.webp" },
  { id: "open-sky", label: "Open sky", src: "assets/prayer-backgrounds/prayer-2.webp" },
  { id: "mountain-sunrise-trail", label: "Mountain sunrise", src: "assets/profile-hero/mountain-sunrise-trail.webp" },
  { id: "moonlit-lake", label: "Moonlit lake", src: "assets/profile-hero/moonlit-lake.webp" },
  { id: "forest-sunrise-trail", label: "Forest trail", src: "assets/profile-hero/forest-sunrise-trail.webp" },
  { id: "coastal-sunset", label: "Coastal sunset", src: "assets/profile-hero/coastal-sunset.webp" },
  { id: "desert-oasis", label: "Desert oasis", src: "assets/profile-hero/desert-oasis.webp" },
  { id: "wildflower-valley", label: "Wildflower valley", src: "assets/profile-hero/wildflower-valley.webp" },
  { id: "northern-lights", label: "Northern lights", src: "assets/profile-hero/northern-lights.webp" },
  { id: "snowy-mountains", label: "Snowy mountains", src: "assets/profile-hero/snowy-mountains.webp" },
  { id: "canyon-river", label: "Canyon river", src: "assets/profile-hero/canyon-river.webp" },
  { id: "ocean-cliffs", label: "Ocean cliffs", src: "assets/profile-hero/ocean-cliffs.webp" },
];
const removedProfileCoverLabels = new Set(["Mountain sunrise", "Community", "Forest", "Prayer", "Sunlit path", "Open sky"]);
const profileCoverOptions = profileCoverCatalog.filter((option) => !removedProfileCoverLabels.has(option.label));
const prayerCardBackgrounds = [
  ...Array.from({ length: 6 }, (_, index) => ({
    id: `prayer-${index + 1}`,
    label: `Prayer background ${index + 1}`,
    src: `assets/prayer-backgrounds/prayer-${index + 1}.webp`,
  })),
  ...profileCoverCatalog
    .filter((option) => !["assets/prayer-backgrounds/prayer-1.webp", "assets/prayer-backgrounds/prayer-2.webp"].includes(option.src))
    .map(({ id, label, src }) => ({ id: `profile-${id}`, label, src })),
];
const PRAYER_BACKGROUND_COUNT = prayerCardBackgrounds.length;
const savedProfile = {
  ...defaultProfile,
  ...readJson("brother.profile", {}),
};
if (/\.(?:png|jpe?g)$/i.test(savedProfile.coverImage)) {
  savedProfile.coverImage = savedProfile.coverImage.replace(/\.(?:png|jpe?g)$/i, ".webp");
  writeJson("brother.profile", savedProfile);
}
if (savedProfile.coverImage === "assets/cloud-account-zen.webp") {
  savedProfile.coverImage = defaultProfile.coverImage;
  writeJson("brother.profile", savedProfile);
}
if (savedProfile.coverImage === "assets/profile-hero-v2.webp") {
  savedProfile.coverImage = defaultProfile.coverImage;
}
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
    description: "Common Muslim objections about Jesus, the Bible, and the crucifixion.",
    level: "Beginner",
    topics: [
      {
        id: "bible-corrupted",
        title: "Has the Bible been corrupted?",
        category: "Bible",
        difficulty: "Essential",
        summary: "Respond to the claim that the biblical text has been changed beyond use.",
        opponentCase: [
          "The Gospels have been changed over time.",
          "The original message of Jesus has been lost.",
          "The manuscripts disagree too much to be reliable.",
        ],
        shortAnswer: "There is no historical evidence of a complete corruption of the Bible. The manuscripts allow us to examine the transmission of the text carefully.",
        keyResponse: [
          "Ask when, where, and by whom the alleged complete corruption took place.",
          "Explain that the large number of manuscripts makes a universal forgery very difficult.",
          "Remember that a manuscript variation does not mean a doctrine has been lost.",
        ],
        longAnswer: "The best response is to acknowledge manuscript variants and explain that we know about them because manuscripts have been preserved. Complete corruption would require a coordinated worldwide replacement without credible historical evidence.",
        keyVerses: ["PSA.119.160", "MAT.5.18", "JHN.17.17"],
        questionsToAsk: [
          "Which original text was supposedly replaced?",
          "Who managed to change all the manuscripts spread across different regions?",
          "Why is there no clear historical record of such an operation?",
        ],
        pitfalls: [
          "Do not suggest that minor manuscript variants do not exist.",
          "Do not respond with contempt.",
          "Avoid rushing through the answer without historical context.",
        ],
      },
      {
        id: "jesus-god",
        title: "Is Jesus really God?",
        category: "Jesus",
        difficulty: "Essential",
        summary: "Show that the divinity of Christ does not rest on a single isolated verse.",
        opponentCase: [
          "Jesus never explicitly said: I am God, worship me.",
          "He prayed to God, so he cannot be God.",
          "Christians exaggerated his status later.",
        ],
        shortAnswer: "The New Testament presents Jesus with the titles, works, authority, and honor that belong to God alone.",
        keyResponse: [
          "Present the cumulative evidence rather than a single slogan.",
          "Distinguish the divinity of the Son from his real incarnation.",
          "Remember that Jesus receives worship and forgives sins.",
        ],
        longAnswer: "The question concerns both how Jesus expressed himself and how the biblical authors identify him. They attribute to him roles and honor reserved for God.",
        keyVerses: ["JHN.1.1", "JHN.8.58", "COL.2.9"],
        questionsToAsk: [
          "Who can forgive sins on their own authority?",
          "Why did the Jewish listeners understand some of the words of Jesus as blasphemy?",
          "Why does Thomas call Jesus my Lord and my God?",
        ],
        pitfalls: [
          "Do not deny the true humanity of Jesus.",
          "Avoid relying only on John 1:1 without explaining its context.",
        ],
      },
      {
        id: "trinity-biblical",
        title: "Is the Trinity biblical?",
        category: "Doctrine",
        difficulty: "Intermediate",
        summary: "Explain the Trinity without relying on confusing analogies.",
        opponentCase: [
          "The word Trinity is not in the Bible.",
          "Three persons means three gods.",
          "This doctrine was invented later.",
        ],
        shortAnswer: "The word does not appear in the Bible, but the doctrine faithfully summarizes what Scripture affirms: one God, with the Father, Son, and Spirit distinct and fully divine.",
        keyResponse: [
          "Clearly distinguish divine essence from personal distinction.",
          "Explain why the discussion involves more than a choice between the Trinity and abstract monotheism.",
          "Use several passages rather than just one.",
        ],
        longAnswer: "The Trinity is a theological formulation that brings together all the biblical evidence without discarding any part of it.",
        keyVerses: ["MAT.28.19", "2CO.13.14", "JHN.14.16-17"],
        questionsToAsk: [
          "Is the Father God? Is the Son God? Is the Spirit God?",
          "How do you hold all these affirmations together without dismissing one?",
        ],
        pitfalls: [
          "Avoid water, ice, and steam analogies.",
          "Do not explain the Trinity as three parts of God.",
        ],
      },
      {
        id: "crucifixion-denied",
        title: "Was Jesus crucified?",
        category: "History",
        difficulty: "Essential",
        summary: "Respond to the denial of the crucifixion using history and the New Testament.",
        opponentCase: [
          "God would never have allowed his prophet to die that way.",
          "Someone else was crucified in his place.",
          "The Christian account was constructed for theological reasons.",
        ],
        shortAnswer: "The crucifixion of Jesus is among the most firmly established facts of early Christian history.",
        keyResponse: [
          "Start with history before discussing the theology of salvation.",
          "Show that even non-Christian sources acknowledge the crucifixion.",
          "Explain why the shame of the cross strengthens the authenticity of the account.",
        ],
        longAnswer: "The challenge concerns the acceptance of what the sources say. The cross is attested very early, at the heart of the earliest Christian proclamation.",
        keyVerses: ["1CO.15.3-4", "MAR.15.24", "ISA.53.5"],
        questionsToAsk: [
          "Why would the first Christians have invented a Messiah humiliated on a cross?",
          "Which ancient historical source seriously supports the substitution of another person?",
        ],
        pitfalls: [
          "Establish the historical event before moving to atonement.",
        ],
      },
    ],
  },
  {
    id: "jehovahs-witnesses",
    title: "Jehovah’s Witnesses",
    icon: "landmark",
    description: "Respond to passages often used against the divinity of Christ and Christian doctrine.",
    level: "Beginner",
    topics: [
      {
        id: "john-1-1",
        title: "Does John 1:1 say “a god”?",
        category: "Bible",
        difficulty: "Essential",
        summary: "Respond to the translation that minimizes the divinity of the Word.",
        opponentCase: [
          "The Greek allows theos to be translated as a god.",
          "Jesus is divine in a secondary sense, rather than fully God.",
        ],
        shortAnswer: "John 1:1 presents the Word as distinct from the Father while fully sharing in the divine identity, rather than as a lesser god among others.",
        keyResponse: [
          "Explain the immediate context of John 1.",
          "Show that John describes all creation as coming through the Word.",
          "Emphasize the consistency of the entire prologue.",
        ],
        longAnswer: "Translating a single word in isolation is insufficient. The prologue attributes to the Word roles and an eternal existence incompatible with the idea of a lesser created divine being.",
        keyVerses: ["JHN.1.1", "JHN.1.3", "JHN.1.18"],
        questionsToAsk: [
          "If everything was made through the Word, where would you place the Word himself?",
          "Why does John begin like Genesis 1 if he only means to describe an exalted creature?",
        ],
        pitfalls: [
          "Do not reduce the discussion to one complicated grammatical rule.",
        ],
      },
      {
        id: "jesus-created",
        title: "Was Jesus the first created being?",
        category: "Jesus",
        difficulty: "Essential",
        summary: "Respond to the idea that the Son was the first work of God.",
        opponentCase: [
          "Colossians calls him the firstborn of all creation.",
          "Proverbs 8 describes Jesus as created before the world.",
        ],
        shortAnswer: "Firstborn does not necessarily mean first created; the term can express rank, inheritance, and supremacy.",
        keyResponse: [
          "Read the whole passage in Colossians 1, rather than an isolated expression.",
          "Show that Christ is above all creation.",
          "Challenge the assumption that firstborn means first created being.",
        ],
        longAnswer: "In Colossians, Paul presents Christ as the one through whom and for whom everything exists, rather than as part of the created world.",
        keyVerses: ["COL.1.15-17", "HEB.1.2-3", "MIC.5.2"],
        questionsToAsk: [
          "Why does Paul say that all things hold together in him?",
          "If Christ is among created things, how can he be the agent of all creation without exception?",
        ],
        pitfalls: [
          "Avoid responding only with slogans against religious groups.",
        ],
      },
      {
        id: "cross-or-stake",
        title: "Cross or stake?",
        category: "History",
        difficulty: "Beginner",
        summary: "Respond without making the exact shape of the instrument the center of the debate.",
        opponentCase: [
          "The Greek word simply means stake.",
          "The symbol of the cross is pagan.",
        ],
        shortAnswer: "The central issue is the historical reality of the redemptive death of Christ.",
        keyResponse: [
          "Keep the discussion focused on the main issue.",
          "Show that Roman history included various forms of crucifixion.",
          "Return to the work of Christ.",
        ],
        longAnswer: "Although the lexical debate exists, the New Testament emphasizes the saving significance of the crucifixion.",
        keyVerses: ["GAL.6.14", "1CO.1.18", "PHI.2.8"],
        questionsToAsk: [
          "Why does the shape of the instrument become more important than the identity of Christ?",
        ],
        pitfalls: [
          "Do not give the impression that Christians worship the physical cross.",
        ],
      },
      {
        id: "michael-archangel",
        title: "Is Jesus Michael the archangel?",
        category: "Jesus",
        difficulty: "Intermediate",
        summary: "Show that the Son is presented as superior to the angels.",
        opponentCase: [
          "Michael commands angels, just as Jesus does.",
          "1 Thessalonians 4 mentions the voice of an archangel.",
        ],
        shortAnswer: "The New Testament places the Son above the angelic world and attributes to him a status angels never receive.",
        keyResponse: [
          "Use Hebrews 1 as a central passage.",
          "Explain the difference between coming with the voice of an archangel and being an archangel.",
        ],
        longAnswer: "The core of the answer is the superiority of the Son in Hebrews: worshiped by angels, creator, and eternal king.",
        keyVerses: ["HEB.1.4-8", "HEB.1.13", "1TH.4.16"],
        questionsToAsk: [
          "Which angel receives the worship of angels?",
          "Why does Hebrews take such care to distinguish the Son from the angels?",
        ],
        pitfalls: [
          "Do not overlook the full context of Hebrews 1.",
        ],
      },
    ],
  },
  {
    id: "atheism",
    title: "Atheism",
    icon: "atom",
    description: "Objections about evil, science, the resurrection, and the reliability of Christian faith.",
    level: "Beginner",
    topics: [
      {
        id: "problem-of-evil",
        title: "Why does God allow evil?",
        category: "Suffering",
        difficulty: "Essential",
        summary: "Address the emotional and philosophical objection with compassion.",
        opponentCase: [
          "A good and almighty God would eliminate evil.",
          "Innocent suffering contradicts the existence of God.",
        ],
        shortAnswer: "Christianity takes evil seriously: it affirms that God judges it, has entered into suffering himself, and promises its final defeat.",
        keyResponse: [
          "Distinguish the logical problem from the existential problem.",
          "Show how the Gospel offers a response embodied in Christ.",
          "Emphasize the cross and the final hope.",
        ],
        longAnswer: "Christianity does not claim that everything is easy to explain now, but offers a vision in which evil is neither denied, absolute, nor victorious.",
        keyVerses: ["ROM.8.18", "REV.21.4", "HEB.4.15"],
        questionsToAsk: [
          "On what objective basis do you call something truly evil?",
          "Why does human moral outrage matter so much if the universe is morally neutral?",
        ],
        pitfalls: [
          "Do not respond coldly to personal suffering.",
          "Avoid simplistic clichés.",
        ],
      },
      {
        id: "science-vs-god",
        title: "Has science made God unnecessary?",
        category: "Science",
        difficulty: "Beginner",
        summary: "Show that science and the existence of God concern different levels of explanation.",
        opponentCase: [
          "Science explains more and more of the universe.",
          "God is only a placeholder for what we do not yet understand.",
        ],
        shortAnswer: "Science explains many mechanisms, but it does not replace fundamental questions about origins, order, intelligibility, and why anything exists.",
        keyResponse: [
          "Reject the false choice between science and God.",
          "Distinguish physical causes from the ultimate foundation.",
          "Show that the intelligibility of the world is itself remarkable.",
        ],
        longAnswer: "The Christian claim is that the entire world ultimately depends on God, including its regular laws, rather than that God fills each temporary gap in knowledge.",
        keyVerses: ["COL.1.16-17", "PSA.19.1", "ROM.1.20"],
        questionsToAsk: [
          "Why is there something rather than nothing?",
          "Why is the universe intelligible and mathematically ordered?",
        ],
        pitfalls: [
          "Avoid poorly understood pseudoscientific arguments.",
        ],
      },
      {
        id: "resurrection-credible",
        title: "Is the resurrection of Jesus credible?",
        category: "History",
        difficulty: "Essential",
        summary: "Ground Christian faith in a publicly proclaimed historical event.",
        opponentCase: [
          "Miracles are impossible.",
          "The disciples invented the story.",
          "The witnesses had hallucinations.",
        ],
        shortAnswer: "The resurrection was proclaimed very early, at the center of apostolic faith, with identifiable witnesses.",
        keyResponse: [
          "Begin with the commonly recognized basic facts.",
          "Show the transformation of the disciples.",
          "Compare competing explanations.",
        ],
        longAnswer: "Christianity rests on a public proclamation of an empty tomb, appearances, and an early apostolic conviction. The honest question is: which explanation best accounts for all the evidence?",
        keyVerses: ["1CO.15.3-8", "LUK.24.36-43", "ACT.2.32"],
        questionsToAsk: [
          "Which natural explanation best accounts for all the evidence together?",
          "Why was the resurrection proclaimed so early in Jerusalem itself?",
        ],
        pitfalls: [
          "Do not describe the resurrection only as an inward experience.",
        ],
      },
      {
        id: "bible-contradictions",
        title: "Is the Bible full of contradictions?",
        category: "Bible",
        difficulty: "Essential",
        summary: "Respond without denying real difficulties in the biblical text.",
        opponentCase: [
          "The accounts do not say exactly the same thing.",
          "Some historical details appear to differ.",
        ],
        shortAnswer: "Difficult passages exist, but variations or different perspectives do not automatically establish a contradiction.",
        keyResponse: [
          "Acknowledge difficult passages honestly.",
          "Distinguish a genuine contradiction from a difference in perspective.",
          "Remember the overall consistency of the biblical message.",
        ],
        longAnswer: "A contradiction requires two incompatible statements about the same point in the same sense. Many objections confuse narrative selection, compression, or different emphases with contradiction.",
        keyVerses: ["LUK.1.1-4", "2TI.3.16", "PSA.12.6"],
        questionsToAsk: [
          "In what way are the two passages logically impossible to reconcile?",
          "Is this a contradiction or simply a different narrative perspective?",
        ],
        pitfalls: [
          "Avoid rushing into artificial harmonizations.",
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

function requireChurchUser() {
  if (!supabaseClient || !supabaseUser) throw new Error("Connecte-toi pour accéder à Mon Église.");
  return supabaseClient;
}

let guestSessionClient = null;

installChurchBridge();

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

const prayerPrompts = [
  "What would you like us to pray for?",
  "What is on your heart today?",
  "How can the community pray with you?",
];
let prayerPromptIndex = 0;
let prayerPromptTimer = null;
let prayerPromptFadeTimer = null;

homeMenuToggle?.addEventListener("click", openHomeMenu);
homeMenuCloseButtons.forEach((button) => button.addEventListener("click", () => closeHomeMenu()));
homeMenuNavigationButtons.forEach((button) => button.addEventListener("click", () => closeHomeMenu({ restoreFocus: false })));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && homeMenuLayer?.classList.contains("is-open")) {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeHomeMenu();
    return;
  }
  keepHomeMenuFocus(event);
});

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

let activeSavedFolderPopover = null;

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-saved-folder-trigger]");
  if (!trigger || !trigger.closest("[data-react-home-library-panel-root]")) return;
  event.stopPropagation();
  openSavedFolderPopover(trigger);
});

document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", closeModal);
});

if (verseAiForm) {
  verseAiForm.addEventListener("submit", handleVerseAiSubmit);
}

[verseAiThread].forEach((thread) => {
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
  if (["preferences", "information", "cloud", "prayers"].includes(tab)) {
    setProfileTab(tab);
  }
});

document.addEventListener("home:library-tab-change", (event) => {
  const tab = event.detail?.tab;
  if (["highlights", "bookmarks", "notes"].includes(tab)) {
    renderHomeLibraryTab(tab);
  }
});

installHomeLibraryBridge();

renderHomeLibraryTab("highlights");

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
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    persistNotesBeforeBackground();
  } else {
    syncPendingState();
  }
});

window.addEventListener("pagehide", persistNotesBeforeBackground);
window.addEventListener("online", () => {
  syncPendingState().catch(error => console.warn("Preference retry failed:", error.message));
});

modalLayer.addEventListener("click", (event) => {
  if (event.target === modalLayer) {
    closeModal();
  }
});

window.addEventListener("load", refreshIcons);
window.appNavigate = setScreen;
let restoredScreenId = "";
try {
  restoredScreenId = window.sessionStorage.getItem(activeScreenStorageKey) || "";
} catch {
  restoredScreenId = "";
}
setScreen(screens.some((screen) => screen.id === restoredScreenId) ? restoredScreenId : (document.querySelector(".screen.is-active")?.id || "home"));

// Keep story progress in the existing account sync queue as well as local storage.
installKidsAdventureProgressBridge();

// Private badge records use the existing per-user state table and its RLS policies.
installKidsBadgesBridge();

installBibleReaderBridge();
installNoteEditorBridge();
installProfileBridge();

installModerationBridge();

const pendingPrayerToggles = new Map();

installPrayerBridge();
installAiBridge();
initHomeStats();
initAuthForm();
const initialSupabaseReady = initSupabase();
renderApologetics();
refreshIcons();

// Bible tools keep the shared Home navigation drawer shell and close behavior.
(() => {
  const layer = document.querySelector('[data-bible-menu-layer]');
  const drawer = document.querySelector('[data-bible-menu-drawer]');
  if (!layer || !drawer) return;
  let lastFocus;
  const toolTabs = [...drawer.querySelectorAll('[data-bible-tool-tab]')];
  const toolPanel = drawer.querySelector('#bible-tool-panel');
  const studyCache = new Map();
  let studyController;
  let studyRequestId = 0;
  let studyProgressTimer;
  let studyProgress;
  function stopStudyProgress() {
    clearInterval(studyProgressTimer);
    studyProgressTimer = undefined;
    studyProgress = undefined;
    toolPanel.setAttribute('aria-busy', 'false');
  }
  function updateStudyProgress(percent) {
    if (!studyProgress) return;
    studyProgress.meter.setAttribute('aria-valuenow', String(percent));
    studyProgress.fill.style.width = `${percent}%`;
    studyProgress.value.textContent = `${percent}%`;
  }
  function displayStudyStatus(message, retry = false) {
    stopStudyProgress();
    toolPanel.replaceChildren();
    const status = document.createElement('p');
    status.className = 'bible-study-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    if (message.startsWith('Preparing ')) {
      status.classList.add('is-loading');
      const spinner = document.createElement('span');
      spinner.className = 'bible-study-loading-spinner';
      spinner.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span');
      label.textContent = message;
      status.append(spinner, label);
    } else {
      status.textContent = message;
    }
    toolPanel.append(status);
    if (status.classList.contains('is-loading')) {
      toolPanel.setAttribute('aria-busy', 'true');
      const progress = document.createElement('div');
      progress.className = 'bible-study-progress';
      progress.innerHTML = '<div class="bible-study-progress-caption"><span>Estimated progress</span><span class="bible-study-progress-value" aria-hidden="true">1%</span></div><div class="bible-study-progress-track" role="progressbar" aria-label="Study preparation — estimated progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="1"><span class="bible-study-progress-fill"></span></div>';
      toolPanel.append(progress);
      studyProgress = {
        meter: progress.querySelector('[role="progressbar"]'),
        fill: progress.querySelector('.bible-study-progress-fill'),
        value: progress.querySelector('.bible-study-progress-value'),
      };
      const startedAt = performance.now();
      updateStudyProgress(1);
      // The API has no measurable progress; reserve completion for a successful response.
      studyProgressTimer = setInterval(() => {
        const elapsed = performance.now() - startedAt;
        updateStudyProgress(Math.min(95, Math.floor(1 + 95 * (1 - Math.exp(-elapsed / 20000)))));
      }, 300);
    }
    if (retry) {
      const button = document.createElement('button');
      button.className = 'bible-study-retry';
      button.type = 'button';
      button.textContent = 'Try again';
      button.addEventListener('click', () => {
        const selectedTab = toolTabs.find(item => item.getAttribute('aria-selected') === 'true');
        if (selectedTab) loadToolTab(selectedTab, true);
      });
      toolPanel.append(button);
    }
  }
  let studyView, disposeStudyView;
  const studyViewReady = import(new URL('scripts/bible-study-view.js?v=12', document.baseURI).href);
  const studyHelpersReady = import(new URL('scripts/bible-study-tools.js?v=2', document.baseURI).href);
  function displayStudyResult(result, tabName, snapshot = window.bibleReaderBridge.getChapterSnapshot()) {
    stopStudyProgress();
    disposeStudyView?.();
    if (!result.study) {
      toolPanel.innerHTML = `<div class="bible-study-result"><p class="bible-study-reference">${escapeHtml(result.reference)}</p><div class="bible-study-copy">${renderRichText(result.text)}</div><p class="bible-study-disclaimer">AI-generated study notes · historical details can be uncertain.</p></div>`;
      return;
    }
    const draftKey = `${snapshot.versionId}.${snapshot.bookId}.${snapshot.chapter}.${tabName}`;
    disposeStudyView = studyView.mountStudyView({
      panel: toolPanel, result, tabName, snapshot, formatText: renderRichText, accountScope: supabaseUser?.id || 'guest', accountReady: initialSupabaseReady.then(()=>supabaseUser?.id || 'guest'),
      async loadPassage(reference, signal) {
        if (reference.bookId === snapshot.bookId && reference.chapter === snapshot.chapter) {
          return { verses: snapshot.quizSource.verses, version: snapshot.versionName };
        }
        const local = LOCAL_BIBLE[snapshot.versionId]?.[`${reference.bookId}.${reference.chapter}`];
        if (local?.verses?.length) return { verses: local.verses, version: snapshot.versionName };
        const selectedVersion = getVersion(snapshot.versionId);
        const version = selectedVersion.source === 'local' ? getRemoteFallbackVersion(selectedVersion.id) : selectedVersion;
        if (!version) throw new Error('This chapter is not available in the selected translation.');
        const params = new URLSearchParams({ bibleId: version.id, bookId: reference.bookId, chapter: String(reference.chapter) });
        const response = await fetch(apiUrl(`/api/bible/chapter?${params}`), { signal });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'The passage could not be loaded.');
        const chapter = normalizeApiChapter(payload.data, version);
        return { verses: chapter.verses, version: chapter.versionName || version.name };
      },
      async ask({item,question,history = [],signal}) {
        if (containsPersonalContactInfo(question)) throw new Error('Please leave email addresses and phone numbers out of your message.');
        const response = await aiFetch(apiUrl('/api/ai/verse'), {
          method: 'POST', headers: {'Content-Type':'application/json'}, signal,
          body: JSON.stringify({
            reference: result.reference, version: snapshot.versionName, audience: 'teen',
            text: snapshot.quizSource.verses.map(verse=>`[${verse.number}] ${verse.text}`).join('\n'),
            question: `Bible Study section: ${tabName}. Card: ${item.title}. Study note (unverified): ${item.detail || ''} ${item.deeper || ''}\n${history.length ? `Conversation so far:\n${history.filter(message=>!containsPersonalContactInfo(message.text)).slice(-10).map(message=>`${message.role}: ${message.text.slice(0,2500)}`).join('\n')}\n` : ''}User question: ${question}\nAnswer in English, stay connected to this chapter, distinguish the passage from interpretation, and do not treat the study note as an established fact. Start with a direct answer, use short paragraphs and at most three bullets when helpful, and keep the reply concise.`,
          }),
        });
        const payload = await response.json();
        if(!response.ok) throw new Error(payload.error || 'Brother AI could not answer. Please try again.');
        return payload.text || 'No answer was returned. Please try again.';
      },
      readReflection(tab, draft) {
        const drafts = readJson('brother.studyReflectionDrafts', {});
        if (draft) { drafts[draftKey] = draft; localStorage.setItem('brother.studyReflectionDrafts',JSON.stringify(drafts)); }
        if(drafts[draftKey]) return drafts[draftKey];
        const first = snapshot.verses[0] || (snapshot.quizSource.verses[0] ? getBibleVerseSnapshot(snapshot.quizSource.verses[0]) : null);
        return savedState.notes[first?.key]?.studyReflections?.[tab] || {};
      },
      async saveReflection({tab,question,answer}) {
        const helpers = await studyHelpersReady;
        const first = snapshot.verses[0] || (snapshot.quizSource.verses[0] ? getBibleVerseSnapshot(snapshot.quizSource.verses[0]) : null);
        if(!first) throw new Error('The chapter has no verse to attach this reflection to.');
        const existing = savedState.notes[first.key] || {};
        const merged = helpers.mergeStudyReflection(existing,{tab,question,answer,reference:result.reference});
        const group = existing.noteGroupId ? Object.values(savedState.notes).filter(note=>note.noteGroupId===existing.noteGroupId) : [{...first,...existing}];
        const groupId = existing.noteGroupId || `study-note-${Date.now()}`;
        for (const item of group) {
          savedState.notes[item.key] = {...item,...merged,noteTitle:item.noteTitle || `Reflection · ${result.reference}`,noteGroupId:groupId,updatedAt:new Date().toISOString()};
        }
        writeJson('brother.notes',savedState.notes);
        refreshProfilePanel();
        document.dispatchEvent(new CustomEvent('home:library-data-change',{detail:{tab:'notes'}}));
        document.dispatchEvent(new CustomEvent('bible:reader-change'));
        syncPendingState().catch(error=>console.warn('Reflection sync will retry:',error.message));
      },
    });
  }
  async function loadToolTab(tab, force = false) {
    if (!tab || !toolPanel || !window.bibleReaderBridge) return;
    studyController?.abort();
    stopStudyProgress();
    const requestId = ++studyRequestId;
    disposeStudyView?.();
    try { studyView = await studyViewReady; } catch { displayStudyStatus('The study tools could not load. Please reload the page.', true); return; }
    if (requestId !== studyRequestId) return;
    const snapshot = window.bibleReaderBridge.getChapterSnapshot();
    const source = snapshot.quizSource;
    const cacheKey = `${snapshot.bookId}.${snapshot.chapter}.${snapshot.versionId}.${tab.dataset.bibleToolTab}`;
    if (!force && studyCache.has(cacheKey)) {
      displayStudyResult(studyCache.get(cacheKey), tab.dataset.bibleToolTab, snapshot);
      return;
    }
    if (snapshot.status !== 'ready' || !source?.verses?.length) {
      displayStudyStatus('The active chapter is still loading. Try again in a moment.', true);
      return;
    }
    const controller = new AbortController();
    studyController = controller;
    toolPanel.replaceChildren();
    toolPanel.setAttribute('aria-busy', 'true');
    try {
      const requestBody = {
        tab: tab.dataset.bibleToolTab,
        book: snapshot.bookName,
        chapter: snapshot.chapter,
        version: source.version,
        language: 'eng',
        verses: source.verses,
      };
      const fetchStudy = (cacheOnly) => aiFetch(apiUrl('/api/bible/study'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...requestBody, cacheOnly }),
        signal: controller.signal,
      });
      let response = await fetchStudy(true);
      let payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'The chapter study could not be loaded.');
      if (payload.cached === false && !payload.study) {
        if (requestId !== studyRequestId || controller.signal.aborted) return;
        displayStudyStatus(`Preparing ${source.reference} for the study`);
        response = await fetchStudy(false);
        payload = await response.json().catch(() => ({}));
      }
      if (!response.ok) throw new Error(payload.error || 'The chapter study could not be loaded.');
      const result = { reference: payload.reference || source.reference, study: payload.study || null, text: payload.text || '' };
      studyCache.set(cacheKey, result);
      if (requestId === studyRequestId && layer.classList.contains('is-open') && tab.getAttribute('aria-selected') === 'true') {
        if (studyProgress) {
          clearInterval(studyProgressTimer);
          updateStudyProgress(100);
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        if (requestId === studyRequestId && layer.classList.contains('is-open') && tab.getAttribute('aria-selected') === 'true') {
          displayStudyResult(result, tab.dataset.bibleToolTab, snapshot);
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError' && requestId === studyRequestId && layer.classList.contains('is-open')) {
        displayStudyStatus(error.message || 'The chapter study is temporarily unavailable.', true);
      }
    }
  }
  function close(restoreFocus = true) {
    if (!layer.classList.contains('is-open')) return;
    studyController?.abort();
    disposeStudyView?.();
    stopStudyProgress();
    layer.classList.remove('is-open');
    layer.setAttribute('aria-hidden', 'true');
    layer.inert = true;
    document.querySelectorAll('[data-bible-menu-toggle]').forEach(button => button.setAttribute('aria-expanded', 'false'));
    if (restoreFocus && lastFocus?.isConnected) lastFocus.focus();
  }
  function resetToolSelection() {
    studyController?.abort();
    stopStudyProgress();
    studyController = undefined;
    studyRequestId += 1;
    toolTabs.forEach(tab => {
      tab.setAttribute('aria-selected', 'false');
      tab.tabIndex = 0;
    });
    toolPanel.removeAttribute('aria-labelledby');
    toolPanel.innerHTML = '<p class="bible-study-empty">Choose a study tab to explore this chapter.</p>';
  }
  document.addEventListener('click', event => {
    const toggle = event.target.closest('[data-bible-menu-toggle]');
    if (!toggle) return;
    closeHomeMenu({ restoreFocus: false });
    resetToolSelection();
    lastFocus = toggle;
    layer.classList.add('is-open');
    layer.setAttribute('aria-hidden', 'false');
    layer.inert = false;
    toggle.setAttribute('aria-expanded', 'true');
    drawer.querySelector('[data-bible-menu-close]')?.focus();
  });
  layer.querySelectorAll('[data-bible-menu-close]').forEach(button => button.addEventListener('click', () => close()));
  function selectToolTab(tab) {
    toolTabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    drawer.querySelector('#bible-tool-panel')?.setAttribute('aria-labelledby', tab.id);
    loadToolTab(tab);
  }
  toolTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectToolTab(tab));
    tab.addEventListener('keydown', event => {
      const direction = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 0;
      if (!direction) return;
      event.preventDefault();
      const next = toolTabs[(index + direction + toolTabs.length) % toolTabs.length];
      selectToolTab(next);
      next.focus();
    });
  });
  document.addEventListener('keydown', event => {
    if (!layer.classList.contains('is-open')) return;
    if (drawer.querySelector('dialog[open]')) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    if (event.key !== 'Tab') return;
    const controls = [...drawer.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), textarea, summary, select')].filter(element => element.getClientRects().length && !element.closest('dialog:not([open])'));
    const first = controls[0], last = controls.at(-1);
    if (!first) { event.preventDefault(); drawer.focus(); return; }
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  window.addEventListener('app:screen-change', () => close(false));
  document.addEventListener('bible:chapter-change', () => close(false));
})();
