import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AiComposer, AiIcon, AiMessage } from "./ai.jsx";

export const debateThemes = [
  {
    id: "islam",
    label: "Islam",
    questions: [
      "How should Christians understand the differences between the Bible and the Quran?",
      "Who is Jesus according to the Bible and according to Islam?",
      "Can the Trinity be understood as biblical monotheism?",
      "Was Jesus crucified, and why does it matter?",
      "How should we evaluate claims that the Bible was corrupted?",
      "What does the Bible teach about the identity of the Messiah?",
      "Can salvation be grounded in both faith and works?",
      "What do Christians mean when they call Jesus the Son of God?",
      "How reliable are the earliest witnesses to Jesus?",
      "What is the role of prophecy in comparing the Bible and the Quran?",
      "How should Christians respond to questions about biblical violence?",
      "Does the Quran confirm or correct the message of the Bible?",
      "What does forgiveness reveal about the character of God?",
      "How should Christians explain the resurrection to a Muslim friend?",
      "Can Christians and Muslims use the word God while meaning different things?",
    ],
  },
  {
    id: "jehovahs-witnesses",
    label: "Jehovah's Witnesses",
    questions: [
      "What does the Bible teach about the identity of Jesus?",
      "Is the Holy Spirit a person or only a force?",
      "How should Christians understand the Trinity?",
      "What does John 1:1 communicate about the Word?",
      "Who alone is worthy of worship according to Scripture?",
      "How should we understand the deity of Christ in the Old Testament?",
      "What does the resurrection of Jesus say about his nature?",
      "Is the New World Translation consistent with the earliest manuscripts?",
      "What does the Bible teach about salvation and the 144,000?",
      "Should Christians pray to Jesus?",
      "What does the Bible mean by eternal life?",
      "How should Christians respond to the claim that Michael the archangel is Jesus?",
      "What authority should guide Christian doctrine?",
      "How should we interpret passages where Jesus is subject to the Father?",
      "What does the Bible teach about the visible and invisible church?",
    ],
  },
  {
    id: "mormonism",
    label: "Mormonism",
    questions: [
      "Who is God according to the Bible?",
      "How should Christians understand the nature of the Trinity?",
      "Is the Bible sufficient for Christian doctrine?",
      "What authority do later scriptures have beside the Bible?",
      "Who is Jesus according to the Bible and the Book of Mormon?",
      "What does salvation mean, and is it earned or received?",
      "Can human beings become gods?",
      "How should Christians evaluate the reliability of prophetic revelation?",
      "What does the Bible teach about life before birth?",
      "How should we understand baptism for the dead?",
      "What does grace accomplish in the life of a believer?",
      "How should Christians respond to the claim that God was once a man?",
      "What makes a text genuinely inspired by God?",
      "How should Christians compare biblical covenants with temple practices?",
      "What does the resurrection promise to every believer?",
    ],
  },
  {
    id: "unbeliever",
    label: "Unbeliever",
    questions: [
      "Can belief in God be rational?",
      "How can a good God allow suffering?",
      "Does science make faith unnecessary?",
      "What is the evidence for the resurrection of Jesus?",
      "Can morality exist without God?",
      "Why trust the Bible as a historical document?",
      "How should Christians respond to apparent contradictions in Scripture?",
      "Does evolution rule out a Creator?",
      "What does human consciousness reveal about reality?",
      "Is religious experience evidence for God?",
      "How can Christians claim truth while religions disagree?",
      "What does Christianity offer that secular humanism does not?",
      "Can objective meaning exist in a material universe?",
      "How should Christians answer the problem of divine hiddenness?",
      "What would count as evidence that Christianity is true?",
    ],
  },
];

export const generalQuestion = "What is the strongest reason to believe the Christian message is true?";
const debateConversationTtl = 30 * 24 * 60 * 60 * 1000;
const debateXpThresholds = [0, 150, 450, 900, 1600, 2600, 4000, 6000, 8500, 11500];

export function getDebateLevelProgress(totalXp) {
  const xp = Math.max(0, Number(totalXp) || 0);
  let levelIndex = debateXpThresholds.length - 1;
  for (let index = 0; index < debateXpThresholds.length; index += 1) {
    if (xp < debateXpThresholds[index]) {
      levelIndex = Math.max(0, index - 1);
      break;
    }
  }
  const currentThreshold = debateXpThresholds[levelIndex];
  const nextThreshold = debateXpThresholds[levelIndex + 1];
  const levelSpan = nextThreshold ? nextThreshold - currentThreshold : 1;
  return {
    level: levelIndex + 1,
    currentXp: nextThreshold ? xp - currentThreshold : xp,
    requiredXp: nextThreshold ? levelSpan : 0,
    progress: nextThreshold ? Math.min(100, ((xp - currentThreshold) / levelSpan) * 100) : 100,
  };
}
export const debateDifficulties = ["Beginner", "Intermediate", "Advanced", "Hostile"];
export const opponentPersonalities = [
  { id: "serious", label: "Serious", description: "Calm, precise, and rigorous.", opening: "I'll take the opposing side. Make your best case, and I'll examine it carefully.", instruction: "Be formal, measured, and rigorous. Use precise language, focus on the strongest version of each objection, and never use jokes or personal remarks." },
  { id: "playful", label: "Playful", description: "Light, witty, and energetic.", opening: "All right, let's make this interesting. I'll take the other side and test your case with a little wit along the way.", instruction: "Be energetic and conversational. Add an occasional gentle joke, witty analogy, or playful aside, but keep the argument sharp and never let humor replace reasoning." },
  { id: "teasing", label: "Teasing", description: "Provocative, sharp, but respectful.", opening: "Go on, make your best case. I'll be watching closely for the gap you hope I won't notice.", instruction: "Use pointed challenges, rhetorical questions, and light teasing to expose weak reasoning. Make the difference obvious, but never insult, belittle, or attack the user personally." },
  { id: "open-minded", label: "Open-minded", description: "Curious and willing to acknowledge good points.", opening: "I'll take the opposing side, but I'm genuinely open to being persuaded. Make your best case.", instruction: "Ask sincere, exploratory questions. Explicitly acknowledge strong points before challenging them, concede when the user's reasoning is persuasive, and avoid arguing just to win." },
  { id: "skeptical", label: "Skeptical", description: "Doubtful and demanding about evidence.", opening: "I'll take the opposing side. Start with your strongest evidence—confidence alone won't convince me.", instruction: "Be doubtful and evidence-focused. Repeatedly ask what supports a claim, separate facts from assumptions, and challenge certainty without becoming dismissive or hostile." },
  { id: "stubborn", label: "Stubborn", description: "Firmly committed and difficult to persuade.", opening: "I'll take the opposing side. You may have to work hard to move me from my position.", instruction: "Defend your position firmly and be slow to concede. Return to your core objection when it is not answered, but stay logically consistent, honest, and respectful rather than unreasonable." },
];
export const debateDifficultyDescriptions = {
  Beginner: {
    behavior: "AI uses clear, simple objections and gives you room to build one focused point.",
    expectations: "Give a direct answer, one basic reason or biblical support, and clear wording. Expert-level detail is not required.",
  },
  Intermediate: {
    behavior: "AI uses balanced counter-arguments and tests the assumptions in your answer.",
    expectations: "Build a structured answer with relevant biblical or historical support and respond directly to the objection.",
  },
  Advanced: {
    behavior: "AI raises stronger objections, hidden assumptions, and challenging follow-up questions.",
    expectations: "Use nuance, carefully supported claims, awareness of context, and anticipate the next challenge.",
  },
  Hostile: {
    behavior: "AI applies pressure with persuasive, loaded, or misleading objections to test your discernment.",
    expectations: "Stay calm, detect weak framing, correct overstatements, defend your position, and remain respectful.",
  },
};

export function DifficultyGuidance({ difficulty }) {
  const guidance = debateDifficultyDescriptions[difficulty];
  if (!guidance) return null;
  return (
    <div className="apologetics-difficulty-guidance">
      <article className="apologetics-difficulty-guidance-card">
        <strong>AI behavior</strong>
        <p>{guidance.behavior}</p>
      </article>
      <article className="apologetics-difficulty-guidance-card">
        <strong>What we expect from you</strong>
        <p>{guidance.expectations}</p>
      </article>
    </div>
  );
}

export const debateScoringRubrics = {
  Beginner: "Logic: make one clear point without a major contradiction. Evidence: give one relevant biblical idea or honest reason without inventing support. Clarity: make the answer understandable and organized. Response: address the main objection directly. Reward a sound, simple answer; do not require expert nuance, several sources, or advanced terminology.",
  Intermediate: "Logic: build a coherent argument and identify important assumptions. Evidence: use relevant biblical or historical support accurately. Clarity: explain the point precisely and in a clear structure. Response: answer the counter-argument and move the discussion forward.",
  Advanced: "Logic: develop a nuanced argument that handles implications and competing objections. Evidence: distinguish strong evidence from weak evidence, use context, and qualify uncertainty. Clarity: stay precise while explaining complexity. Response: anticipate likely follow-up objections and defend the central claim.",
  Hostile: "Logic: stay consistent while resisting traps, loaded questions, and misleading framing. Evidence: correct overstatements and unsupported claims without overclaiming yourself. Clarity: remain concise, calm, and understandable under pressure. Response: answer the strongest point directly, preserve the user's position, and respond respectfully.",
};

const debateXpRewardThresholds = {
  Beginner: [82, 68, 52, 36],
  Intermediate: [90, 75, 55, 40],
  Advanced: [92, 80, 62, 48],
  Hostile: [94, 84, 68, 52],
};

export function getDebateXpReward(difficulty, averageCriteria) {
  const [excellent, strong, solid, developing] = debateXpRewardThresholds[difficulty] || debateXpRewardThresholds.Intermediate;
  if (averageCriteria >= excellent) return 20;
  if (averageCriteria >= strong) return 15;
  if (averageCriteria >= solid) return 10;
  if (averageCriteria >= developing) return 5;
  return 0;
}

const questionsPerPage = 5;

export function DebateQuestionCarousel({ questions, value, onChange }) {
  const [page, setPage] = useState(0);
  const touchStartX = useRef(null);
  const pageCount = Math.max(1, Math.ceil(questions.length / questionsPerPage));

  useEffect(() => {
    const selectedIndex = questions.indexOf(value);
    if (selectedIndex >= 0) {
      setPage(Math.floor(selectedIndex / questionsPerPage));
    } else {
      setPage((current) => Math.min(current, pageCount - 1));
    }
  }, [questions, value, pageCount]);

  const movePage = (nextPage) => setPage(Math.max(0, Math.min(pageCount - 1, nextPage)));
  const handleTouchStart = (event) => { touchStartX.current = event.touches[0]?.clientX ?? null; };
  const handleTouchEnd = (event) => {
    if (touchStartX.current === null) return;
    const distance = event.changedTouches[0]?.clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(distance) < 40) return;
    movePage(page + (distance < 0 ? 1 : -1));
  };

  return (
    <div className="apologetics-debate-question-carousel">
      <div className="apologetics-debate-question-pages" aria-label="Question blocks">
        {Array.from({ length: pageCount }, (_, index) => (
          <button
            className={page === index ? "is-active" : ""}
            key={index}
            type="button"
            aria-label={`Question block ${index + 1} of ${pageCount}`}
            aria-current={page === index ? "page" : undefined}
            onClick={() => movePage(index)}
          >
            <span aria-hidden="true" />
          </button>
        ))}
      </div>
      <div className="apologetics-debate-question-viewport" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="apologetics-debate-question-track" style={{ transform: `translate3d(-${page * 100}%, 0, 0)` }}>
          {Array.from({ length: pageCount }, (_, pageIndex) => (
            <div className="apologetics-debate-question-list" key={pageIndex} aria-label={`Question block ${pageIndex + 1}`}>
              {questions.slice(pageIndex * questionsPerPage, (pageIndex + 1) * questionsPerPage).map((item, index) => {
                const questionIndex = pageIndex * questionsPerPage + index;
                return (
                  <button className={value === item ? "is-selected" : ""} key={item} type="button" onClick={() => onChange(item)} aria-pressed={value === item}>
                    <span>{questionIndex === 0 ? "General" : `Question ${questionIndex}`}</span>
                    <strong>{item}</strong>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getDebateConversationKey(theme, question) {
  return `brother.debateConversation.${theme?.id || "general"}.${encodeURIComponent(question || generalQuestion)}`;
}

function readDebateConversation(theme, question) {
  try {
    const stored = JSON.parse(localStorage.getItem(getDebateConversationKey(theme, question)) || "null");
    if (!stored || Date.now() - Number(stored.updatedAt || 0) > debateConversationTtl) {
      localStorage.removeItem(getDebateConversationKey(theme, question));
      return null;
    }
    return stored.messages?.length ? stored.messages : null;
  } catch {
    return null;
  }
}

const debateOpeningChallenge = "I’ll take the opposing side. Make your best case, and I’ll challenge it fairly.";

function normalizeDebateOpening(messages, question) {
  if (!messages?.length) return messages;
  const openingQuestion = question || generalQuestion;
  const first = messages[0];
  const second = messages[1];
  if (first?.role !== "assistant" || second?.role !== "assistant") return messages;
  if (first.text !== openingQuestion || second.text !== debateOpeningChallenge) return messages;
  return [{ ...first, text: `${first.text}\n\n${second.text}` }, ...messages.slice(2)];
}

function readDebateProgress(theme, question) {
  try {
    const stored = JSON.parse(localStorage.getItem(getDebateConversationKey(theme, question)) || "null");
    return stored?.confidence ? { confidence: stored.confidence, journal: stored.journal || [] } : { confidence: 50, journal: [] };
  } catch {
    return { confidence: 50, journal: [] };
  }
}

function saveDebateConversation(theme, question, messages, difficulty = "Intermediate", factCheck = false, confidence = 50, journal = [], opponentPersonality = "serious") {
  const cleanMessages = messages.filter((message) => !message.pending && message.text);
  localStorage.setItem(getDebateConversationKey(theme, question), JSON.stringify({ themeId: theme?.id, question, difficulty, opponentPersonality, factCheck, confidence, journal: journal.slice(-20), updatedAt: Date.now(), messages: cleanMessages }));
  document.dispatchEvent(new CustomEvent("debate:conversation-change"));
}

function getLatestDebateConversation() {
  let latest = null;
  const expiredKeys = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key?.startsWith("brother.debateConversation.")) continue;
    try {
      const stored = JSON.parse(localStorage.getItem(key) || "null");
      if (!stored?.messages?.length || Date.now() - Number(stored.updatedAt || 0) > debateConversationTtl) {
        expiredKeys.push(key);
        continue;
      }
      if (!latest || Number(stored.updatedAt) > Number(latest.updatedAt)) latest = stored;
    } catch {
      expiredKeys.push(key);
    }
  }
  expiredKeys.forEach((key) => localStorage.removeItem(key));
  return latest;
}

function DebateRoomView({ theme, question, difficulty, opponentPersonality = "serious", factCheck, savedMessages, onBack }) {
  const bridge = window.aiBridge;
  const selectedPersonality = opponentPersonalities.find((item) => item.id === opponentPersonality) || opponentPersonalities[0];
  const initialMessages = [
    { role: "assistant", text: `${question || generalQuestion}\n\n${selectedPersonality.opening}` },
  ];
  const [messages, setMessages] = useState(() => normalizeDebateOpening(savedMessages?.length ? savedMessages : readDebateConversation(theme, question), question) || initialMessages);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [verseSupportOpen, setVerseSupportOpen] = useState(false);
  const [verseSupportLoading, setVerseSupportLoading] = useState(false);
  const [verseSupportText, setVerseSupportText] = useState("");
  const [hintsOpen, setHintsOpen] = useState(false);
  const [hintsLoading, setHintsLoading] = useState(false);
  const [hintsText, setHintsText] = useState("");
  const [betterAnswerOpen, setBetterAnswerOpen] = useState(false);
  const [betterAnswerLoading, setBetterAnswerLoading] = useState(false);
  const [betterAnswerText, setBetterAnswerText] = useState("");
  const [roomFactCheck, setRoomFactCheck] = useState(factCheck);
  const [roomInfoOpen, setRoomInfoOpen] = useState(false);
  const savedProgress = readDebateProgress(theme, question);
  const [confidence, setConfidence] = useState(savedProgress.confidence);
  const [confidenceJournal, setConfidenceJournal] = useState(savedProgress.journal);
  const [confidenceOpen, setConfidenceOpen] = useState(false);
  const [totalXp, setTotalXp] = useState(() => bridge.getDebateXp?.() || 0);
  const threadRef = useRef(null);

  useEffect(() => {
    const appShell = document.querySelector(".app-shell");
    appShell?.classList.add("is-debate-room");
    return () => appShell?.classList.remove("is-debate-room");
  }, []);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
    saveDebateConversation(theme, question, messages, difficulty, roomFactCheck, confidence, confidenceJournal, opponentPersonality);
  }, [messages, roomFactCheck, confidence, confidenceJournal]);

  useEffect(() => {
    const persistBeforeLeaving = () => saveDebateConversation(theme, question, messages, difficulty, roomFactCheck, confidence, confidenceJournal, opponentPersonality);
    window.addEventListener("pagehide", persistBeforeLeaving);
    return () => {
      persistBeforeLeaving();
      window.removeEventListener("pagehide", persistBeforeLeaving);
    };
  }, [messages, roomFactCheck, confidence, confidenceJournal]);

  useEffect(() => {
    if (!verseSupportOpen && !hintsOpen && !betterAnswerOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setVerseSupportOpen(false);
        setHintsOpen(false);
        setBetterAnswerOpen(false);
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [verseSupportOpen, hintsOpen, betterAnswerOpen]);

  const openVerseSupport = async () => {
    setVerseSupportOpen(true);
    setVerseSupportLoading(true);
    setVerseSupportText("");
    try {
      const history = messages.filter((message) => !message.pending).slice(-8);
      const context = `You are supporting a Christian apologetics debate. Theme: ${theme?.label || "General"}. Central question: ${question || generalQuestion}. Based on the recent discussion below, suggest exactly 3 relevant Bible passages. For each, provide the reference, the exact passage text if you know it reliably, and one short sentence explaining its connection. Never invent a quotation; if unsure, give only the reference and say that the full text should be checked in the Bible.\n\nRecent discussion:\n${history.map((message) => `${message.role}: ${message.text}`).join("\n")}`;
      const responseText = await bridge.sendDebate(context, history);
      setVerseSupportText(responseText);
    } catch (error) {
      setVerseSupportText(error.message || "Unable to find verse support right now.");
    } finally {
      setVerseSupportLoading(false);
    }
  };

  const openHints = async () => {
    setHintsOpen(true);
    setHintsLoading(true);
    setHintsText("");
    try {
      const history = messages.filter((message) => !message.pending).slice(-8);
      const context = `You are coaching a Christian apologetics debate. Theme: ${theme?.label || "General"}. Central question: ${question || generalQuestion}. Based on the recent discussion below, provide exactly 3 short, progressive hints to help the user build their own answer. Hint 1 should suggest an angle, hint 2 an argument or distinction, and hint 3 a useful biblical or historical direction. Do not write the complete answer. Number each hint clearly.\n\nRecent discussion:\n${history.map((message) => `${message.role}: ${message.text}`).join("\n")}`;
      const responseText = await bridge.sendDebate(context, history);
      setHintsText(responseText);
    } catch (error) {
      setHintsText(error.message || "Unable to find hints right now.");
    } finally {
      setHintsLoading(false);
    }
  };

  const openBetterAnswer = async () => {
    const latestArgument = [...messages].reverse().find((message) => message.role === "user")?.text;
    if (!latestArgument) {
      setDraft("Write an argument first, then I can help improve it.");
      return;
    }
    setBetterAnswerOpen(true);
    setBetterAnswerLoading(true);
    setBetterAnswerText("");
    try {
      const context = `You are a Christian apologetics debate coach. Theme: ${theme?.label || "General"}. Central question: ${question || generalQuestion}. Analyze the user's latest argument below. Explain the main improvement opportunities, then provide a stronger rewritten version that remains faithful to the user's position. Use exactly these headings: What to improve, Better answer, Why it is stronger. Do not send the answer in the debate; this is only a coaching preview.\n\nUser's latest argument:\n${latestArgument}`;
      const responseText = await bridge.sendDebate(context, messages.filter((message) => !message.pending).slice(-8));
      setBetterAnswerText(responseText);
    } catch (error) {
      setBetterAnswerText(error.message || "Unable to improve this answer right now.");
    } finally {
      setBetterAnswerLoading(false);
    }
  };

  const sendText = async (text) => {
    if (!text || pending || !bridge) return;
    const history = messages.filter((message) => !message.pending).slice(-24);
    setMessages((current) => [
      ...current,
      { role: "user", text, time: "Now" },
      { role: "assistant", text: "", pending: true },
    ]);
    setDraft("");
    setPending(true);
    try {
      const factCheckInstruction = roomFactCheck ? "Wrap any claim you believe is false, invented, or needs verification in [[FACT]] and [[/FACT]] markers so the app can highlight it." : "Do not use fact-check markers.";
      const context = `Stay in character as the user's opposing debater, never as a coach or tutor. Make the selected personality obvious in every response and do not fall back to a generic assistant tone. Debate theme: ${theme?.label || "General"}. Central question: ${question || generalQuestion}. Difficulty: ${difficulty}. Opponent personality: ${selectedPersonality.label}. Personality direction: ${selectedPersonality.instruction} ${difficulty === "Hostile" ? "You may use plausible but intentionally flawed objections, but never fabricate a Bible quotation." : "Keep objections accurate and fair."} Begin by disagreeing with the latest argument or acknowledging one specific point before challenging it. Give a direct counter-argument, expose assumptions and unanswered questions, then end with one question the user must defend. Do not give improvement advice or a replacement answer. Never invent evidence or Bible quotations. Stay charitable and intellectually honest. ${factCheckInstruction}`;
      const responseText = await bridge.sendDebate(`${context}\n\nUser response: ${text}`, history);
      setMessages((current) => [...current.slice(0, -1), { role: "assistant", text: responseText }]);
      try {
        const scoringRubric = debateScoringRubrics[difficulty] || debateScoringRubrics.Intermediate;
        const evaluation = await bridge.evaluateDebate(`Evaluate this user's latest debate response for a Christian apologetics practice session. Difficulty: ${difficulty}. Current confidence score: ${confidence}%. User response: ${text}. Use this level-specific rubric and do not judge a Beginner by Advanced standards: ${scoringRubric} Return JSON only with this shape: {"change": number from -8 to 8, "reason": "one short explanation", "criteria": {"logic": 0-100, "evidence": 0-100, "clarity": 0-100, "response": 0-100}}. Judge the quality of reasoning, not whether the position agrees with you.`);
        const parsed = JSON.parse(evaluation.match(/\{[\s\S]*\}/)?.[0] || "{}");
        const change = Math.max(-8, Math.min(8, Number(parsed.change) || 0));
        const nextScore = Math.max(0, Math.min(100, confidence + change));
        setConfidence(nextScore);
        setConfidenceJournal((current) => [...current, { score: nextScore, change, reason: parsed.reason || "Your response was evaluated by the debate coach." }]);
        const criteriaValues = Object.values(parsed.criteria || {}).map(Number).filter((value) => Number.isFinite(value));
        const averageCriteria = criteriaValues.length ? criteriaValues.reduce((sum, value) => sum + value, 0) / criteriaValues.length : 0;
        const xpReward = getDebateXpReward(difficulty, averageCriteria);
        if (xpReward && bridge.addDebateXp) setTotalXp(bridge.addDebateXp(xpReward));
      } catch {
        // The debate continues even if the optional score evaluation is unavailable.
      }
    } catch (error) {
      setMessages((current) => [...current.slice(0, -1), { role: "assistant", text: error.message || "AI is not available yet." }]);
    } finally {
      setPending(false);
    }
  };

  const levelProgress = getDebateLevelProgress(totalXp);

  const leaveRoom = () => {
    saveDebateConversation(theme, question, messages, difficulty, roomFactCheck, confidence, confidenceJournal, opponentPersonality);
    onBack();
  };

  const toggleRoomInfo = () => {
    setRoomInfoOpen((current) => !current);
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    await sendText(text);
  };

  const verseBlocks = verseSupportText.split(/(?=\b\d+\.\s)/).map((block) => block.trim()).filter(Boolean);
  const hintBlocks = hintsText.split(/(?=\b\d+\.\s)/).map((block) => block.trim()).filter(Boolean);
  const formatDebateText = (text) => {
    const spacedText = String(text || "").replace(/\r\n/g, "\n");
    const html = bridge.format(spacedText);
    return roomFactCheck
      ? html.replace(/\[\[FACT\]\]([\s\S]*?)\[\[\/FACT\]\]/g, '<mark class="debate-fact-check">$1</mark>')
      : html.replace(/\[\[FACT\]\]|\[\[\/FACT\]\]/g, "");
  };

  return (
    <>
    <div className="apologetics-debate-room">
      <header className="apologetics-debate-room-header">
        <button className="apologetics-debate-room-back" type="button" onClick={leaveRoom} aria-label="Back to debate setup">←</button>
        <div>
          <h1>Debat room</h1>
        </div>
      </header>

      <div className="apologetics-debate-room-settings">
        <div className="apologetics-debate-room-info">
          <button className="apologetics-debate-room-info-toggle" type="button" onMouseDown={(event) => event.preventDefault()} onClick={toggleRoomInfo} aria-expanded={roomInfoOpen} aria-controls="debate-room-information">
            <span>Room informations</span>
            <span className={`apologetics-debate-room-info-arrow${roomInfoOpen ? " is-open" : ""}`} aria-hidden="true">⌄</span>
          </button>
          {roomInfoOpen && (
            <div className="apologetics-debate-room-context" id="debate-room-information">
              <span>Difficulty: <strong>{difficulty}</strong></span>
              <span>Personality: <strong>{selectedPersonality.label}</strong></span>
              <span>Theme: <strong>{theme?.label || "General"}</strong></span>
              <span>Question: <strong>{question || generalQuestion}</strong></span>
            </div>
          )}
        </div>
      </div>

      <section className="apologetics-debate-progress" aria-label="Debate progress">
        <button className="apologetics-debate-progress-main" type="button" onClick={() => setConfidenceOpen((current) => !current)} aria-expanded={confidenceOpen}>
          <div className="apologetics-debate-progress-ring" style={{ "--confidence": confidence }}>{confidence}%</div>
          <div><strong>Confidence</strong><p>Neutral starting point. Build your case.</p></div>
          <div className="apologetics-debate-level"><strong>Level {levelProgress.level}</strong><span>{levelProgress.requiredXp ? `${levelProgress.currentXp} / ${levelProgress.requiredXp} XP` : `${levelProgress.currentXp} XP`}</span><i><b style={{ width: `${levelProgress.progress}%` }}></b></i></div>
        </button>
        {confidenceOpen && (
          <div className="apologetics-debate-confidence-journal">
            <div className="apologetics-debate-confidence-journal-heading"><strong>Score journal</strong><span>Tap the card to close</span></div>
            {confidenceJournal.length ? confidenceJournal.slice().reverse().map((entry, index) => <div className="apologetics-debate-confidence-entry" key={`${entry.score}-${index}`}><b>{entry.score}%</b><div><strong>{entry.change >= 0 ? `+${entry.change}` : entry.change}%</strong><p>{entry.reason}</p></div></div>) : <div className="apologetics-debate-confidence-entry"><b>50%</b><div><strong>Neutral baseline</strong><p>Every debate starts here. Your score changes as your answers are evaluated.</p></div></div>}
            <div className="apologetics-debate-confidence-criteria"><span>Logic</span><span>Evidence</span><span>Clarity</span><span>Response</span></div>
          </div>
        )}
      </section>

      <div className="apologetics-debate-carousel" aria-label="Debate context and tools">
        <div className="apologetics-debate-tools" aria-label="Debate tools">
          <button type="button" onClick={openHints}><span>♧</span><strong>Hints</strong><b>›</b></button>
          <button type="button" onClick={openVerseSupport}><span>▢</span><strong>Verse support</strong><b>›</b></button>
          <button type="button" onClick={openBetterAnswer}><span>☆</span><strong>Better answer</strong><b>›</b></button>
          <button className={roomFactCheck ? "is-on" : ""} type="button" onClick={() => setRoomFactCheck((current) => !current)} aria-pressed={roomFactCheck}><span>✓</span><strong>Fact-check</strong><b>{roomFactCheck ? "On" : "Off"}</b></button>
        </div>
      </div>

      <div className="chat-thread apologetics-debate-chat-thread" ref={threadRef} aria-label="Debate conversation">
        {messages.map((message, index) => <AiMessage key={`${message.role}-${index}-${message.text}`} message={message} bridge={bridge} formatText={formatDebateText} pendingLabel="Your debat partner is thinking..." showAvatar />)}
      </div>

    </div>
    {createPortal(
      <>
        <AiComposer value={draft} onChange={setDraft} onSubmit={sendMessage} placeholder="Type your response..." ariaLabel="Type your response" disabled={pending} className="apologetics-debate-composer" submitLabel="Send response" />
        {verseSupportOpen && (
          <div className="apologetics-debate-verse-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setVerseSupportOpen(false); }}>
            <section className="apologetics-debate-verse-modal" role="dialog" aria-modal="true" aria-labelledby="verse-support-title">
              <button className="apologetics-debate-verse-close" type="button" onClick={() => setVerseSupportOpen(false)} aria-label="Close verse support">×</button>
              <span className="apologetics-debate-verse-eyebrow">DEBATE SUPPORT</span>
              <h2 id="verse-support-title">Verse support</h2>
              <p className="apologetics-debate-verse-intro">Passages connected to your question and recent discussion.</p>
              <div className="apologetics-debate-verse-results">
                {verseSupportLoading ? <p className="apologetics-debate-verse-loading shining-text">Brother AI is finding relevant passages...</p> : verseBlocks.map((verse, index) => (
                  <article className="apologetics-debate-verse-item" key={`${verse.slice(0, 30)}-${index}`}>
                    <div className="rich-text" dangerouslySetInnerHTML={{ __html: bridge.format(verse) }} />
                    <button type="button" onClick={() => { setVerseSupportOpen(false); sendText(`Use this Bible passage in our debate and help me apply it:\n\n${verse}`); }}>Use in debate</button>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
        {hintsOpen && (
          <div className="apologetics-debate-verse-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setHintsOpen(false); }}>
            <section className="apologetics-debate-verse-modal" role="dialog" aria-modal="true" aria-labelledby="hints-title">
              <button className="apologetics-debate-verse-close" type="button" onClick={() => setHintsOpen(false)} aria-label="Close hints">×</button>
              <span className="apologetics-debate-verse-eyebrow">DEBATE COACH</span>
              <h2 id="hints-title">Hints</h2>
              <p className="apologetics-debate-verse-intro">Build your own answer one step at a time.</p>
              <div className="apologetics-debate-verse-results">
                {hintsLoading ? <p className="apologetics-debate-verse-loading shining-text">Brother AI is preparing helpful hints...</p> : hintBlocks.map((hint, index) => (
                  <article className="apologetics-debate-verse-item" key={`${hint.slice(0, 30)}-${index}`}>
                    <div className="rich-text" dangerouslySetInnerHTML={{ __html: bridge.format(hint) }} />
                    <button type="button" onClick={() => { setHintsOpen(false); sendText(`Use this coaching hint in our debate and help me apply it:\n\n${hint}`); }}>Use in debate</button>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
        {betterAnswerOpen && (
          <div className="apologetics-debate-verse-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setBetterAnswerOpen(false); }}>
            <section className="apologetics-debate-verse-modal" role="dialog" aria-modal="true" aria-labelledby="better-answer-title">
              <button className="apologetics-debate-verse-close" type="button" onClick={() => setBetterAnswerOpen(false)} aria-label="Close better answer">×</button>
              <span className="apologetics-debate-verse-eyebrow">DEBATE COACH</span>
              <h2 id="better-answer-title">Better answer</h2>
              <p className="apologetics-debate-verse-intro">Strengthen your argument before sending it back to your opponent.</p>
              <div className="apologetics-debate-verse-results">
                {betterAnswerLoading ? <p className="apologetics-debate-verse-loading shining-text">Brother AI is improving your answer...</p> : (
                  <>
                    <div className="rich-text" dangerouslySetInnerHTML={{ __html: bridge.format(betterAnswerText) }} />
                    <button className="apologetics-debate-use-answer" type="button" onClick={() => {
                      const improvedAnswer = betterAnswerText.match(/Better answer\s*:?\s*([\s\S]*?)(?=\n\s*(?:Why it is stronger|What to improve)\s*:|$)/i)?.[1]?.trim() || betterAnswerText;
                      setDraft(improvedAnswer);
                      setBetterAnswerOpen(false);
                    }}>Use this answer</button>
                  </>
                )}
              </div>
            </section>
          </div>
        )}
      </>,
      document.querySelector(".phone-frame"),
    )}
    </>
  );
}

export function ApologeticsDebatePage() {
  const [themeId, setThemeId] = useState("");
  const [question, setQuestion] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [opponentPersonality, setOpponentPersonality] = useState("serious");
  const [factCheck, setFactCheck] = useState(false);
  const [isRoomOpen, setIsRoomOpen] = useState(false);
  const [savedDebate, setSavedDebate] = useState(() => getLatestDebateConversation());
  const [resumeDebate, setResumeDebate] = useState(null);
  const theme = debateThemes.find((item) => item.id === themeId);

  useEffect(() => {
    const openLatestDebate = () => {
      const latest = getLatestDebateConversation();
      const savedTheme = debateThemes.find((item) => item.id === latest?.themeId);
      if (!latest || !savedTheme) return;
      setSavedDebate(latest);
      setThemeId(savedTheme.id);
      setQuestion(latest.question || generalQuestion);
      setDifficulty(latest.difficulty || "Intermediate");
      setOpponentPersonality(latest.opponentPersonality || "serious");
      setFactCheck(Boolean(latest.factCheck));
      setResumeDebate(latest);
      setIsRoomOpen(true);
    };
    document.addEventListener("debate:open-latest", openLatestDebate);
    return () => document.removeEventListener("debate:open-latest", openLatestDebate);
  }, []);

  const goBack = () => window.appNavigate?.("apologetics");
  const questions = theme ? [generalQuestion, ...theme.questions] : [];

  if (isRoomOpen) {
    return <DebateRoomView theme={theme} question={question} difficulty={difficulty} opponentPersonality={opponentPersonality} factCheck={factCheck} savedMessages={resumeDebate?.messages} onBack={() => { setSavedDebate(getLatestDebateConversation()); setResumeDebate(null); setIsRoomOpen(false); }} />;
  }

  return (
    <div className="apologetics-debate-content">
      <header className="apologetics-debate-header">
        <button className="apologetics-debate-back" type="button" onClick={goBack} aria-label="Back to Apologetics">←</button>
        <div>
          <h1>Debat room</h1>
        </div>
      </header>

      <section className="apologetics-debate-step apologetics-debate-step--theme" aria-labelledby="debate-theme-title">
        <div className="apologetics-debate-step-heading">
          <span>01</span>
          <div>
            <h2 id="debate-theme-title">Choose a debate theme</h2>
            <p>Select the perspective you want to explore.</p>
          </div>
        </div>
        <div className="apologetics-debate-theme-list">
          {debateThemes.map((item) => (
            <button className={themeId === item.id ? "is-selected" : ""} key={item.id} type="button" onClick={() => { setThemeId(themeId === item.id ? "" : item.id); setQuestion(""); }} aria-pressed={themeId === item.id}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="apologetics-debate-setup-settings">
          <div><span>Difficulty</span><div className="apologetics-debate-difficulty-list">{debateDifficulties.map((level) => <button className={difficulty === level ? "is-selected" : ""} type="button" key={level} onClick={() => setDifficulty(level)}>{level}</button>)}</div><DifficultyGuidance difficulty={difficulty} /></div>
        </div>

        <section className="apologetics-debate-setup-settings apologetics-debate-personality-settings" aria-labelledby="opponent-personality-title">
          <div>
            <span id="opponent-personality-title">Opponent personality</span>
            <p className="apologetics-debate-personality-intro">Choose the tone and attitude of your opponent.</p>
            <div className="apologetics-debate-personality-list">
              {opponentPersonalities.map((personality) => (
                <button className={opponentPersonality === personality.id ? "is-selected" : ""} type="button" key={personality.id} onClick={() => setOpponentPersonality(personality.id)} aria-pressed={opponentPersonality === personality.id}>
                  {personality.label}
                </button>
              ))}
            </div>
            <p className="apologetics-debate-personality-description">{opponentPersonalities.find((item) => item.id === opponentPersonality)?.description}</p>
          </div>
        </section>
      </section>

      {theme ? (
        <section className="apologetics-debate-step apologetics-debate-step--questions" aria-labelledby="debate-question-title">
          <div className="apologetics-debate-step-heading">
            <span>02</span>
            <div>
              <h2 id="debate-question-title">Choose the central question</h2>
              <p>General is always available, or pick a focused question for {theme.label}.</p>
            </div>
          </div>
          <DebateQuestionCarousel questions={questions} value={question} onChange={setQuestion} />
        </section>
      ) : (
        <p className="apologetics-debate-empty">Choose a theme to unlock the debate questions.</p>
      )}

      <div className={`apologetics-debate-actions${savedDebate ? " has-continue" : ""}`}>
        <button className="apologetics-debate-launch" type="button" disabled={!theme || !question || !difficulty} onClick={() => { setResumeDebate(null); setIsRoomOpen(true); }}>
          Lancer le debat
        </button>
        {savedDebate && (
          <button className="apologetics-debate-continue" type="button" onClick={() => {
            const savedTheme = debateThemes.find((item) => item.id === savedDebate.themeId);
            if (!savedTheme) return;
            setThemeId(savedTheme.id);
            setQuestion(savedDebate.question || generalQuestion);
            setDifficulty(savedDebate.difficulty || "Intermediate");
            setOpponentPersonality(savedDebate.opponentPersonality || "serious");
            setFactCheck(Boolean(savedDebate.factCheck));
            setResumeDebate(savedDebate);
            setIsRoomOpen(true);
          }}>
            Continuer mon debat
          </button>
        )}
      </div>
    </div>
  );
}
