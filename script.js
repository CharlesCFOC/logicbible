const screens = [...document.querySelectorAll("[data-screen]")];
const navButtons = [...document.querySelectorAll("[data-nav]")];
const appShell = document.querySelector(".app-shell");
const modalLayer = document.querySelector("[data-modal-layer]");
const searchPanel = document.querySelector("[data-search-panel]");
const verseSheet = document.querySelector("[data-verse-sheet]");
const verseAiPanel = document.querySelector("[data-verse-ai-panel]");
const selectedVerse = document.querySelector("[data-selected-verse]");
const sheetFeedback = document.querySelector("[data-sheet-feedback]");
const verseDetail = document.querySelector("[data-verse-detail]");
const verseAiReference = document.querySelector("[data-verse-ai-reference]");
const verseAiContext = document.querySelector("[data-verse-ai-context]");
const verseAiThread = document.querySelector("[data-verse-ai-thread]");
const verseAiForm = document.querySelector("[data-verse-ai-form]");
const verseAiInput = verseAiForm?.querySelector("input");
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
const aiMemoryKey = "brother.aiMemory";
const aiBookmarksKey = "brother.aiBookmarks";
const apologeticsChatKey = "brother.apologeticsChat";
const apologeticsProgressKey = "brother.apologeticsProgress";
const aiMemoryTtlMs = 24 * 60 * 60 * 1000;
const maxAiMemoryMessages = 24;

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
const parallelSelects = document.querySelector("[data-parallel-selects]");
const parallelVersionOne = document.querySelector("[data-parallel-version-one]");
const backgroundOptionsTrack = document.querySelector("[data-background-options]");
const backgroundOptionButtons = [...document.querySelectorAll("[data-background-option]")];
const textSizeOptionButtons = [...document.querySelectorAll("[data-text-size-option]")];
const accentOptionButtons = [...document.querySelectorAll("[data-accent-option]")];
const profileAvatar = document.querySelector("[data-profile-avatar]");
const profileName = document.querySelector("[data-profile-name]");
const profileStreak = document.querySelector("[data-profile-streak]");
const profileForm = document.querySelector("[data-profile-form]");
const profileFormFeedback = document.querySelector("[data-profile-form-feedback]");
const profileAuthStatus = document.querySelector("[data-profile-auth-status]");
const profileStorageStatus = document.querySelector("[data-profile-storage-status]");
const profileAccountId = document.querySelector("[data-profile-account-id]");
const profileViewButtons = [...document.querySelectorAll("[data-profile-view]")];
const profileSavedPanel = document.querySelector("[data-profile-saved-panel]");

const readerState = {
  versionId: localStorage.getItem("brother.version") || "local-kjv",
  bookId: localStorage.getItem("brother.book") || "JHN",
  chapter: Number(localStorage.getItem("brother.chapter") || 15),
  versions: [...LOCAL_VERSIONS],
  showHighlightsOnly: false,
  parallelEnabled: localStorage.getItem("brother.parallel") === "true",
  parallelVersionIds: readJson("brother.parallelVersions", ["local-web"]),
};
let chapterRequestId = 0;
let selectedVerseData = null;
let verseAiContextData = null;
let currentChapterData = null;
let activeProfileView = "";
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
  background: "dark",
  textSize: "medium",
  accent: "electric-blue",
};
const defaultProfile = {
  displayName: "Charles",
  email: "",
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
  { id: "gold", label: "Gold", value: "rgba(182, 138, 53, 0.30)" },
  { id: "honey", label: "Honey", value: "rgba(216, 161, 58, 0.28)" },
  { id: "sage", label: "Sage", value: "rgba(116, 145, 101, 0.28)" },
  { id: "emerald", label: "Emerald", value: "rgba(61, 139, 92, 0.28)" },
  { id: "teal", label: "Teal", value: "rgba(55, 145, 145, 0.26)" },
  { id: "sky", label: "Sky", value: "rgba(80, 132, 180, 0.30)" },
  { id: "indigo", label: "Indigo", value: "rgba(86, 101, 176, 0.28)" },
  { id: "violet", label: "Violet", value: "rgba(136, 104, 190, 0.28)" },
  { id: "rose", label: "Rose", value: "rgba(200, 71, 91, 0.26)" },
  { id: "clay", label: "Clay", value: "rgba(190, 104, 74, 0.26)" },
  { id: "pearl", label: "Pearl", value: "rgba(232, 227, 216, 0.20)" },
  { id: "charcoal", label: "Charcoal", value: "rgba(255, 255, 255, 0.12)" },
  { id: "electric-lime", label: "Lime", value: "rgba(190, 255, 45, 0.24)" },
  { id: "electric-cyan", label: "Cyan", value: "rgba(0, 229, 255, 0.23)" },
  { id: "electric-blue", label: "Volt Blue", value: "rgba(45, 125, 255, 0.28)" },
  { id: "electric-purple", label: "Neon Purple", value: "rgba(170, 75, 255, 0.26)" },
  { id: "electric-pink", label: "Hot Pink", value: "rgba(255, 45, 180, 0.24)" },
  { id: "electric-orange", label: "Neon Orange", value: "rgba(255, 115, 35, 0.24)" },
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
  WEB: "World English Bible",
};
const popularVersionOrder = ["KJV", "NKJV", "NLT", "CSB", "WEB"];
const textSizeOptions = {
  xs: "15px",
  small: "17px",
  medium: "19px",
  large: "22px",
  xl: "25px",
};
const accentOptions = {
  "electric-blue": { value: "#00e5ff", soft: "rgba(0, 229, 255, 0.16)", contrast: "#03191d" },
  violet: { value: "#9d7cff", soft: "rgba(157, 124, 255, 0.18)", contrast: "#ffffff" },
  lime: { value: "#baff29", soft: "rgba(186, 255, 41, 0.18)", contrast: "#151a05" },
  pink: { value: "#ff4fc3", soft: "rgba(255, 79, 195, 0.18)", contrast: "#ffffff" },
  amber: { value: "#ffb020", soft: "rgba(255, 176, 32, 0.18)", contrast: "#1e1300" },
};

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
const apologeticsOverviewState = {
  featuredExpanded: false,
  trackFrameworkOpen: {},
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
}

function getTodayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
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
}

function clearAiMemory() {
  localStorage.removeItem(aiMemoryKey);
}

function savePreferences() {
  writeJson("brother.preferences", savedPreferences);
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
}

function applyProfile() {
  const displayName = String(savedProfile.displayName || defaultProfile.displayName).trim() || defaultProfile.displayName;
  const streakLabel = String(savedProfile.streakLabel || defaultProfile.streakLabel).trim() || defaultProfile.streakLabel;
  const authStatus = String(savedProfile.authStatus || defaultProfile.authStatus).trim() || defaultProfile.authStatus;
  const storageStatus = String(savedProfile.storageStatus || defaultProfile.storageStatus).trim() || defaultProfile.storageStatus;
  const accountId = String(savedProfile.accountId || defaultProfile.accountId).trim() || defaultProfile.accountId;
  const avatarInitials = String(savedProfile.avatarInitials || "").trim().toUpperCase() || getProfileInitials(displayName);

  savedProfile.displayName = displayName;
  savedProfile.streakLabel = streakLabel;
  savedProfile.authStatus = authStatus;
  savedProfile.storageStatus = storageStatus;
  savedProfile.accountId = accountId;
  savedProfile.avatarInitials = avatarInitials;

  if (profileAvatar) {
    profileAvatar.textContent = avatarInitials;
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
    if (formData.get("email") !== savedProfile.email) {
      profileForm.elements.email.value = savedProfile.email || "";
    }
    if (formData.get("avatarInitials") !== avatarInitials) {
      profileForm.elements.avatarInitials.value = avatarInitials;
    }
    if (formData.get("bio") !== savedProfile.bio) {
      profileForm.elements.bio.value = savedProfile.bio || "";
    }
  }
}

function setActivePreference(buttons, activeValue, dataKey) {
  buttons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset[dataKey] === activeValue);
  });
}

function applyPreferences() {
  const accent = accentOptions[savedPreferences.accent] || accentOptions[defaultPreferences.accent];
  const textSize = textSizeOptions[savedPreferences.textSize] || textSizeOptions[defaultPreferences.textSize];

  appShell.dataset.appBackground = savedPreferences.background || defaultPreferences.background;
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

function initPreferences() {
  initLoopingBackgroundCarousel();

  backgroundOptionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      savedPreferences.background = button.dataset.backgroundOption;
      savePreferences();
      applyPreferences();
      centerBackgroundOption(savedPreferences.background);
    });
  });

  textSizeOptionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      savedPreferences.textSize = button.dataset.textSizeOption;
      savePreferences();
      applyPreferences();
    });
  });

  accentOptionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      savedPreferences.accent = button.dataset.accentOption;
      savePreferences();
      applyPreferences();
    });
  });

  applyPreferences();
  window.requestAnimationFrame(() => centerBackgroundOption(savedPreferences.background, "auto"));
}

function initProfile() {
  applyProfile();

  if (!profileForm) {
    return;
  }

  profileForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const displayName = String(profileForm.elements.displayName.value || "").trim();
    const email = String(profileForm.elements.email.value || "").trim();
    const avatarInitialsInput = String(profileForm.elements.avatarInitials.value || "").trim().toUpperCase();
    const bio = String(profileForm.elements.bio.value || "").trim();

    savedProfile.displayName = displayName || defaultProfile.displayName;
    savedProfile.email = email;
    savedProfile.bio = bio;
    savedProfile.avatarInitials = avatarInitialsInput || getProfileInitials(savedProfile.displayName);
    savedProfile.accountId = email
      ? `local-${email.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 28) || "user"}`
      : `local-${savedProfile.displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 28) || "user"}`;

    saveProfile();
    applyProfile();

    if (profileFormFeedback) {
      profileFormFeedback.textContent = "Information saved locally. It will be ready to sync once Supabase auth is connected.";
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
  localStorage.setItem("brother.apologetics.track", apologeticsState.trackId);
  localStorage.setItem("brother.apologetics.category", apologeticsState.category);
  localStorage.setItem("brother.apologetics.topic", apologeticsState.topicId);
  localStorage.setItem("brother.apologetics.selectedTrackTopic", apologeticsState.selectedTrackTopicId || "");
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

  apologeticsTopics.innerHTML = apologeticsTracksData.map((track, index) => {
    const featuredTopics = track.topics.slice(0, 3);
    const isCollapsible = index === 0;
    const isExpanded = !isCollapsible || apologeticsOverviewState.featuredExpanded;
    return `
      <section class="apologetics-featured-group${isCollapsible ? " is-collapsible" : ""}${isExpanded ? " is-expanded" : ""}">
        <div class="section-heading apologetics-featured-group-heading">
          <h3>${escapeHtml(track.title)}</h3>
          <span>${featuredTopics.length}</span>
        </div>
        <div class="apologetics-topic-carousel-wrap">
          <div class="apologetics-topic-carousel">
          ${featuredTopics.map((topic) => `
            <button class="apologetics-topic-card apologetics-topic-card--carousel" data-apologetics-topic="${escapeAttr(topic.id)}" data-apologetics-track-jump="${escapeAttr(track.id)}">
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
            </button>
          `).join("")}
          </div>
          ${isCollapsible && !isExpanded ? `
            <button class="apologetics-carousel-expand" data-apologetics-featured-toggle aria-label="Expand featured topics">
              <span>+</span>
            </button>
          ` : ""}
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
    <button class="apologetics-challenge-button" data-apologetics-topic="${escapeAttr(challenge.id)}" data-apologetics-track-jump="${escapeAttr(challenge.trackId)}">
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
    return `
    <button class="apologetics-topic-card apologetics-topic-card--${escapeAttr(topic.category.toLowerCase())} ${topic.id === apologeticsState.selectedTrackTopicId ? "is-selected" : ""}" data-apologetics-topic="${escapeAttr(topic.id)}">
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
        <i data-lucide="plus"></i>
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

function setScreen(id) {
  const activeNavId = id.startsWith("apologetics") ? "apologetics" : id;
  appShell.dataset.activeScreen = id;
  screens.forEach((screen) => {
    screen.classList.toggle("is-active", screen.id === id);
    if (screen.id === id) {
      screen.scrollTop = 0;
    }
  });

  navButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.nav === activeNavId);
  });

  if (id.startsWith("apologetics")) {
    renderApologetics();
  }

  renderApologeticsBeginButton();
}

function showModal(panel) {
  [searchPanel, verseSheet, verseAiPanel].forEach((item) => item?.classList.remove("is-visible"));
  modalLayer.hidden = false;
  panel.classList.add("is-visible");
  appShell.dataset.modal = panel === verseSheet ? "verse" : panel === verseAiPanel ? "verse-ai" : "standard";
  const input = panel.querySelector("input, textarea");
  if (input) {
    window.setTimeout(() => input.focus(), 80);
  }
}

function closeModal() {
  [searchPanel, verseSheet, verseAiPanel].forEach((item) => item?.classList.remove("is-visible"));
  modalLayer.hidden = true;
  delete appShell.dataset.modal;
  document.querySelectorAll(".scripture-line.is-selected, .parallel-scripture-line.is-selected").forEach((line) => line.classList.remove("is-selected"));
  hideVerseDetail();
}

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
  if (version.id === "local-web") return "WEB";
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

  if (localVersionId === "local-web") {
    return remoteVersions.find((version) => /World English Bible|WEB/i.test(`${version.abbreviation} ${version.name}`));
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
  const filterNotice = readerState.showHighlightsOnly
    ? `
      <div class="reader-filter-banner">
        <span>Versets highlightés</span>
        <button data-clear-highlight-filter>Tout afficher</button>
      </div>
    `
    : "";

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
      const highlighted = highlight ? " is-highlighted" : "";
      const bookmarked = savedState.bookmarks[versionedKey] ? " is-bookmarked" : "";
      const colorStyle = highlight?.colorValue ? ` style="--highlight-color: ${highlight.colorValue}"` : "";
      return `
        <p class="scripture-line${highlighted}${bookmarked}"${colorStyle} data-verse="${reference}" data-highlight-key="${highlightKey}" data-verse-key="${versionedKey}" data-verse-number="${verse.number || ""}" data-verse-version="${escapeAttr(chapter.version || version.abbreviation)}" data-verse-text="${escapeAttr(verse.text)}">
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
  return `
    <div class="parallel-scripture-grid">
      ${visibleVerses
    .map((verse) => {
      const reference = `${book.name} ${readerState.chapter}${verse.number ? `:${verse.number}` : ""}`;
      const highlightKey = getCanonicalVerseKey(book.id, readerState.chapter, verse.number || 0);
      const versionedKey = getVersionedVerseKey(book.id, readerState.chapter, verse.number || 0, version.abbreviation);
      migrateLegacyHighlight(highlightKey, versionedKey);
      const highlight = savedState.highlights[highlightKey];
      const highlighted = highlight ? " is-highlighted" : "";
      const bookmarked = savedState.bookmarks[versionedKey] ? " is-bookmarked" : "";
      const colorStyle = highlight?.colorValue ? ` style="--highlight-color: ${highlight.colorValue}"` : "";
      const comparisonChapter = parallelChapters[0];
      const comparisonVersion = comparisonChapter?.version || getVersion(readerState.parallelVersionIds[0])?.abbreviation || "Compare";
      const comparisonText = comparisonChapter
        ? getVerseTextFromChapter(comparisonChapter, verse.number) || "Verse not available in this version."
        : "Choose a version to compare.";
      const verseNumber = verse.number ? `<sup>${verse.number}</sup>` : "";

      return `
        <article class="parallel-scripture-line${highlighted}${bookmarked}"${colorStyle} data-verse="${reference}" data-highlight-key="${highlightKey}" data-verse-key="${versionedKey}" data-verse-number="${verse.number || ""}" data-verse-version="${escapeAttr(chapter.version || version.abbreviation)}" data-verse-text="${escapeAttr(verse.text)}">
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
  window.setTimeout(() => {
    if (sheetFeedback.textContent === message) {
      sheetFeedback.textContent = "";
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
  return `${selectedVerseData.reference} ${selectedVerseData.version}\n${selectedVerseData.text}`;
}

function setVerseActionActive(action, active) {
  const button = verseSheet.querySelector(`[data-verse-action="${CSS.escape(action)}"]`);
  button?.classList.toggle("is-active", active);
}

function syncVerseActionStates() {
  if (!selectedVerseData) {
    return;
  }

  setVerseActionActive("highlight", Boolean(savedState.highlights[selectedVerseData.highlightKey]));
  setVerseActionActive("bookmark", Boolean(savedState.bookmarks[selectedVerseData.key]));
  setVerseActionActive("parallel", readerState.parallelEnabled);
}

async function loadChapter() {
  const requestId = ++chapterRequestId;
  renderLoading();
  localStorage.setItem("brother.version", readerState.versionId);
  localStorage.setItem("brother.book", readerState.bookId);
  localStorage.setItem("brother.chapter", String(readerState.chapter));
  localStorage.setItem("brother.parallel", String(readerState.parallelEnabled));
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
    renderChapter(chapter, parallelChapters);
    return chapter;
  } catch (error) {
    if (requestId !== chapterRequestId) {
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
  parallelSelects.hidden = !readerState.parallelEnabled;
}

function renderBookOptions() {
  bookSelect.innerHTML = BOOKS.map((book) => `<option value="${book.id}">${book.name}</option>`).join("");
  bookSelect.value = readerState.bookId;
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
      ...remoteVersions,
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

    verse.addEventListener("click", () => {
      if (Date.now() < suppressClickUntil) {
        return;
      }

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

    verse.addEventListener("touchend", (event) => {
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      const isLeftSwipe = deltaX < -64 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4;
      if (!isLeftSwipe) {
        return;
      }

      suppressClickUntil = Date.now() + 700;
      selectedVerseData = getVerseDataFromElement(verse);
      document.querySelectorAll(".scripture-line.is-selected, .parallel-scripture-line.is-selected").forEach((line) => line.classList.remove("is-selected"));
      verse.classList.add("is-selected");
      openVerseAiChat(selectedVerseData);
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
      <button class="secondary-button" data-remove-highlight>Remove Highlight</button>
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
  const lines = document.querySelectorAll(`[data-highlight-key="${CSS.escape(selectedVerseData.highlightKey)}"]`);
  const existingHighlight = savedState.highlights[selectedVerseData.highlightKey];
  const folderId = verseDetail.querySelector("[data-highlight-folder-select]")?.value || existingHighlight?.folderId || "";
  savedState.highlights[selectedVerseData.highlightKey] = {
    ...selectedVerseData,
    key: selectedVerseData.highlightKey,
    folderId,
    color: color.id,
    colorValue: color.value,
    updatedAt: new Date().toISOString(),
  };
  lines.forEach((line) => {
    line.classList.add("is-highlighted");
    line.style.setProperty("--highlight-color", color.value);
  });
  verseDetail.querySelectorAll("[data-highlight-color]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.highlightColor === color.id);
  });
  writeJson("brother.highlights", savedState.highlights);
  setFeedback(`${color.label} highlight applied.`);
  syncVerseActionStates();
  refreshProfilePanel();
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

function toggleBookmark() {
  const line = document.querySelector(`[data-verse-key="${CSS.escape(selectedVerseData.key)}"]`);
  if (savedState.bookmarks[selectedVerseData.key]) {
    delete savedState.bookmarks[selectedVerseData.key];
    line?.classList.remove("is-bookmarked");
    setFeedback("Bookmark removed.");
  } else {
    savedState.bookmarks[selectedVerseData.key] = {
      ...selectedVerseData,
      createdAt: new Date().toISOString(),
    };
    line?.classList.add("is-bookmarked");
    setFeedback("Bookmarked.");
  }
  writeJson("brother.bookmarks", savedState.bookmarks);
  syncVerseActionStates();
  refreshProfilePanel();
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
    if (note) {
      savedState.notes[selectedVerseData.key] = {
        ...selectedVerseData,
        note,
        updatedAt: new Date().toISOString(),
      };
      setFeedback("Note saved.");
    } else {
      delete savedState.notes[selectedVerseData.key];
      setFeedback("Note cleared.");
    }
    writeJson("brother.notes", savedState.notes);
  });
  verseDetail.querySelector("[data-note-input]").focus();
}

function askAiAboutVerse() {
  closeModal();
  setScreen("ai");
  if (aiComposerInput) {
    aiComposerInput.value = `Explain ${selectedVerseData.reference} (${selectedVerseData.version}) with biblical context, original language, cross references, and application. Verse: "${selectedVerseData.text}"`;
    resizeAiComposerInput();
    aiComposerInput.focus();
  }
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
      body: JSON.stringify({ prompt, history }),
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

  clearAiMemory();
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
    button.classList.remove("is-active");
    triggerAiActionAnimation(button, "is-success");
    setFeedback("AI bookmark removed.");
  } else {
    savedState.aiBookmarks[messageId] = {
      id: messageId,
      text,
      createdAt: new Date().toISOString(),
    };
    button.classList.add("is-active");
    triggerAiActionAnimation(button, "is-success");
    setFeedback("AI response bookmarked.");
  }

  writeJson(aiBookmarksKey, savedState.aiBookmarks);
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
  verseDetail.hidden = false;
  verseDetail.innerHTML = `
    <div class="detail-stack">
      <h3>${language.title}</h3>
      <p>Loading original-language data...</p>
    </div>
  `;

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

    verseDetail.innerHTML = `
      <div class="detail-stack">
        <h3>${payload.language === "hebrew" ? "Original Hebrew" : "Original Greek"}</h3>
        <div class="source-credit">STEP Bible · Tyndale House · ${escapeHtml(payload.source?.license || "CC BY 4.0")}</div>
        ${payload.words.map((word) => `
          <article class="original-word-card">
            <div>
              <strong>${escapeHtml(word.original)}</strong>
              <span>${escapeHtml(word.transliteration || word.lemma || "")}</span>
            </div>
            <p>${escapeHtml(word.english || word.gloss || "")}</p>
            <dl>
              <dt>Lemma</dt><dd>${escapeHtml(word.lemma || "—")}</dd>
              <dt>Strong</dt><dd>${escapeHtml(word.strong || "—")}</dd>
              <dt>Morph</dt><dd>${escapeHtml(word.morphology || "—")}</dd>
              <dt>Gloss</dt><dd>${escapeHtml(word.gloss || word.lexicalGloss || "—")}</dd>
            </dl>
          </article>
        `).join("")}
      </div>
    `;
  } catch (error) {
    const insights = greekInsights[selectedVerseData.bookId]?.[selectedVerseData.chapter]?.[selectedVerseData.number] || [];
    verseDetail.innerHTML = `
      <div class="detail-stack">
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
  const source = getSavedSource(type);
  if (!source[storageKey]) {
    return;
  }

  source[storageKey].folderId = folderId || "";
  writeSavedSource(type);
  refreshProfilePanel();
}

function getSavedRows(type, folderId = activeProfileFolders[type] || "") {
  const source = type === "highlights" ? savedState.highlights : savedState.bookmarks;
  return Object.entries(source)
    .map(([storageKey, item]) => ({ ...item, storageKey }))
    .filter((item) => item?.bookId && item?.chapter && item?.number)
    .filter((item) => !folderId || (folderId === "unfiled" ? !item.folderId : item.folderId === folderId))
    .sort((a, b) => String(b.createdAt || b.updatedAt || "").localeCompare(String(a.createdAt || a.updatedAt || "")));
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

function renderProfileSavedPanel(type) {
  if (!profileSavedPanel) {
    return;
  }

  activeProfileView = type;
  profileViewButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.profileView === type);
  });

  const folders = getSavedFolders(type);
  const activeFolder = activeProfileFolders[type] || "";
  const rows = getSavedRows(type, activeFolder);
  const totalRows = getSavedRows(type, "").length;
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
      rows.length
        ? rows.map((row, index) => `
            <article class="saved-verse-row">
              <button class="saved-verse-open" data-saved-row="${index}">
                ${type === "highlights" ? `<span class="saved-color-dot" style="--saved-color: ${escapeAttr(row.colorValue || "var(--beige)")}" aria-hidden="true"></span>` : '<i data-lucide="bookmark"></i>'}
                <span>
                  <strong>${escapeHtml(row.reference || `${row.bookId} ${row.chapter}:${row.number}`)}</strong>
                  <small>${escapeHtml(row.version || "")}</small>
                  <p>${escapeHtml(row.text || "")}</p>
                </span>
              </button>
              <label class="saved-folder-select">
                <span>Folder</span>
                <select data-saved-folder="${escapeAttr(row.storageKey)}">
                  ${folderOptions}
                </select>
              </label>
            </article>
          `).join("")
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
  profileSavedPanel.querySelectorAll("[data-saved-folder]").forEach((select) => {
    const row = rows.find((item) => item.storageKey === select.dataset.savedFolder);
    select.value = row?.folderId || "";
    select.addEventListener("change", () => assignSavedFolder(type, select.dataset.savedFolder, select.value));
  });
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
    if (action === "highlight") showHighlightPicker();
    if (action === "copy") await copyVerse();
    if (action === "share") await shareVerse();
    if (action === "bookmark") toggleBookmark();
    if (action === "note") showNoteEditor();
    if (action === "ask-ai") askAiAboutVerse();
    if (action === "original-language") await showOriginalLanguagePanel();
    if (action === "compare") showComparePanel();
    if (action === "parallel") await showParallelFromVerse();
    if (action === "target") showHighlightedVersesOnly();
  } catch (error) {
    setFeedback(error.message || "Action failed.");
  }
}

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

  parallelVersionOne?.addEventListener("change", () => {
    readerState.parallelVersionIds = [parallelVersionOne.value];
    loadChapter();
  });

  loadChapter();
  loadRemoteVersions();
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => setScreen(button.dataset.nav));
});

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
  aiComposerInput.addEventListener("input", resizeAiComposerInput);
  aiComposerInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      aiForm?.requestSubmit();
    }
  });
}

if (newAiChatButton) {
  newAiChatButton.addEventListener("click", resetAiChat);
}

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

document.querySelectorAll("[data-verse-action]").forEach((button) => {
  button.addEventListener("click", () => {
    button.classList.add("is-pressed");
    window.setTimeout(() => button.classList.remove("is-pressed"), 180);
    handleVerseAction(button.dataset.verseAction);
  });
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
  const toggleButton = event.target.closest("[data-apologetics-featured-toggle]");
  if (toggleButton) {
    apologeticsOverviewState.featuredExpanded = !apologeticsOverviewState.featuredExpanded;
    renderApologeticsFeaturedTopics();
    refreshIcons();
    return;
  }

  const button = event.target.closest("[data-apologetics-topic]");
  if (!button) {
    return;
  }

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

modalLayer.addEventListener("click", (event) => {
  if (event.target === modalLayer) {
    closeModal();
  }
});

window.addEventListener("load", refreshIcons);
appShell.dataset.activeScreen = document.querySelector(".screen.is-active")?.id || "home";
initProfile();
initPreferences();
initReader();
restoreAiMemory();
renderApologetics();
refreshIcons();
