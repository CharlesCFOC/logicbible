import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { confidenceScoringRows, getConfidenceScoringInstruction, normalizeConfidenceChange } from "../../lib/ai/debate-scoring.js";
import { opponentPersonalities } from "../../lib/ai/debate-personality.js";
import { highlightBibleCitations } from "../../lib/ai/bible-citations.js";
import { AiComposer, AiIcon, AiMessage } from "./ai.jsx";
import { debateDifficultyDescriptions, debateScoringRubrics, getDebateDifficulty } from "../../lib/ai/debate-difficulty.js";
import { debateThemes } from "../../lib/ai/debate-topics.js";
export { debateThemes, debateDifficultyDescriptions, debateScoringRubrics };

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

export function DebateQuestionCarousel({ questions, topics = [], value, onChange }) {
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
      <div className="apologetics-debate-question-pages" aria-label="Question pages">
        {Array.from({ length: pageCount }, (_, index) => (
          <button className={page === index ? "is-active" : ""} key={index} type="button" aria-label={`Question page ${index + 1} of ${pageCount}`} aria-current={page === index ? "page" : undefined} onClick={() => movePage(index)}>
            <span aria-hidden="true" />
          </button>
        ))}
      </div>
      <div className="apologetics-debate-question-viewport" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="apologetics-debate-question-track" style={{ transform: `translate3d(-${page * 100}%, 0, 0)` }}>
          {Array.from({ length: pageCount }, (_, pageIndex) => (
            <div className="apologetics-debate-question-list" key={pageIndex} aria-label={`Question page ${pageIndex + 1}`}>
              {questions.slice(pageIndex * questionsPerPage, (pageIndex + 1) * questionsPerPage).map((item, index) => {
                const questionIndex = pageIndex * questionsPerPage + index;
                return <button className={value === item ? "is-selected" : ""} key={item} type="button" onClick={() => onChange(value === item ? "" : item)} aria-pressed={value === item}>
                  <span>{`Question ${questionIndex + 1}`}</span>
                  {topics[questionIndex] && <span className="debate-question-topic">{topics[questionIndex]}</span>}
                  <strong>{item}</strong>
                </button>;
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
    return Number.isFinite(stored?.confidence) ? { confidence: stored.confidence, journal: stored.journal || [] } : { confidence: 50, journal: [] };
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

function startNewDebateConversation(theme, question, difficulty, factCheck, personalityId) {
  const personality = opponentPersonalities.find((item) => item.id === personalityId) || opponentPersonalities[0];
  const opening = [{ role: "assistant", text: `${question || generalQuestion}\n\n${personality.opening}${difficulty === "Beginner" ? " Just one simple reason in your own words is enough." : ""}` }];
  // Remove previous sessions, including a debate on the same question.
  const oldKeys = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith("brother.debateConversation.")) oldKeys.push(key);
  }
  oldKeys.forEach((key) => localStorage.removeItem(key));
  // Persist immediately so refresh/closing before the first reply keeps the new session.
  saveDebateConversation(theme, question, opening, difficulty, factCheck, 50, [], personality.id);
  return getLatestDebateConversation();
}

function DebateRoomView({ theme, question, difficulty, opponentPersonality = "serious", factCheck, savedMessages, onBack }) {
  const bridge = window.aiBridge;
  const difficultyProfile = getDebateDifficulty(difficulty);
  const difficultyContext = `Difficulty: ${difficulty}. ${difficultyProfile.instruction} For coaching aids, preserve this reading level and these evidence expectations. Keep each hint or explanation short.`;
  const selectedPersonality = opponentPersonalities.find((item) => item.id === opponentPersonality) || opponentPersonalities[0];
  const initialMessages = [
    { role: "assistant", text: `${question || generalQuestion}\n\n${selectedPersonality.opening}${difficulty === "Beginner" ? " Just one simple reason in your own words is enough." : ""}` },
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
  const [scoringTableOpen, setScoringTableOpen] = useState(false);
  const savedProgress = readDebateProgress(theme, question);
  const [confidence, setConfidence] = useState(savedProgress.confidence);
  const [confidenceJournal, setConfidenceJournal] = useState(savedProgress.journal);
  const [confidenceOpen, setConfidenceOpen] = useState(false);
  const [totalXp, setTotalXp] = useState(() => bridge.getDebateXp?.() || 0);
  const [isDebateScreenActive, setIsDebateScreenActive] = useState(() => document.querySelector("#apologetics-debate")?.classList.contains("is-active") || false);
  useEffect(() => {
    const handleScreenChange = (event) => setIsDebateScreenActive(event.detail?.id === "apologetics-debate");
    window.addEventListener("app:screen-change", handleScreenChange);
    return () => window.removeEventListener("app:screen-change", handleScreenChange);
  }, []);
  const threadRef = useRef(null);
  const confidenceCarouselRef = useRef(null);
  const [confidencePage, setConfidencePage] = useState(0);

  useEffect(() => {
    const appShell = document.querySelector(".app-shell");
    if (isDebateScreenActive) appShell?.classList.add("is-debate-room");
    return () => appShell?.classList.remove("is-debate-room");
  }, [isDebateScreenActive]);

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
      const context = `You are supporting a Christian apologetics debate. Theme: ${theme?.label || "General"}. Topic: ${theme?.topics?.[theme.questions.indexOf(question)] || "General"}. Central question: ${question || generalQuestion}. Based on the recent discussion below, suggest ${difficulty === "Beginner" ? "1" : "3"} relevant Bible passage${difficulty === "Beginner" ? "" : "s"}. ${difficultyContext} For each, provide the reference, the exact passage text if you know it reliably, and one short sentence explaining its connection. Never invent a quotation; if unsure, give only the reference and say that the full text should be checked in the Bible.\n\nRecent discussion:\n${history.map((message) => `${message.role}: ${message.text}`).join("\n")}`;
      const responseText = await bridge.sendDebate(context, history, { difficulty, mode: "coach" });
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
      const context = `You are coaching a Christian apologetics debate. Theme: ${theme?.label || "General"}. Topic: ${theme?.topics?.[theme.questions.indexOf(question)] || "General"}. Central question: ${question || generalQuestion}. Based on the recent discussion below, ${difficultyContext} Provide exactly 3 short, progressive hints to help the user build their own answer. Hint 1 should suggest an angle, hint 2 an argument or distinction, and hint 3 a useful biblical or historical direction. Do not write the complete answer. Number each hint clearly.\n\nRecent discussion:\n${history.map((message) => `${message.role}: ${message.text}`).join("\n")}`;
      const responseText = await bridge.sendDebate(context, history, { difficulty, mode: "coach" });
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
      const context = `You are a Christian apologetics debate coach. Theme: ${theme?.label || "General"}. Topic: ${theme?.topics?.[theme.questions.indexOf(question)] || "General"}. Central question: ${question || generalQuestion}. ${difficultyContext} Analyze the user's latest argument below. Do not turn a Beginner or Intermediate answer into an academic argument or demand exact references at those levels. Explain the main improvement opportunities, then provide a stronger rewritten version that remains faithful to the user's position. Use exactly these headings: What to improve, Better answer, Why it is stronger. Do not send the answer in the debate; this is only a coaching preview.\n\nUser's latest argument:\n${latestArgument}`;
      const responseText = await bridge.sendDebate(context, messages.filter((message) => !message.pending).slice(-8), { difficulty, mode: "coach" });
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
      const context = `Stay in character as the user's opposing debater, never as a coach or tutor. Difficulty takes priority over personality: never let a serious, skeptical, teasing, or stubborn personality increase the vocabulary, length, or evidence demands beyond this level. ${difficultyContext} Make the selected personality obvious in every response and do not fall back to a generic assistant tone. Debate theme: ${theme?.label || "General"}. Topic: ${theme?.topics?.[theme.questions.indexOf(question)] || "General"}. Central question: ${question || generalQuestion}. Difficulty: ${difficulty}. Opponent personality: ${selectedPersonality.label}. Personality direction: ${selectedPersonality.instruction} Keep objections accurate and fair at every level. React to one specific point from the latest argument in your distinctive character voice. Vary the opening rather than following the same formula every turn. Give one counter-argument appropriate to the selected level, then end with one question the user must answer. Do not give improvement advice or a replacement answer. Never invent evidence or Bible quotations. Stay charitable and intellectually honest. ${factCheckInstruction}`;
      const responseText = await bridge.sendDebate(`${context}\n\nUser response: ${text}`, history, { difficulty, personality: selectedPersonality.id });
      setMessages((current) => [...current.slice(0, -1), { role: "assistant", text: responseText }]);
      try {
        const scoringRubric = debateScoringRubrics[difficulty] || debateScoringRubrics.Beginner;
        const evaluation = await bridge.evaluateDebate(`Evaluate this user's latest debate response for a Christian apologetics practice session. Difficulty: ${difficulty}. Current confidence score: ${confidence}%. Debate question: ${question}. Previous discussion: ${JSON.stringify(history)}. User response: ${text}. Use this level-specific rubric and do not judge a Beginner by Advanced standards: ${scoringRubric} ${getConfidenceScoringInstruction(difficulty)} Return JSON only with this shape: {"change": integer from -8 to 8, "responseType": "argument|clarification|uncertainty|evasion", "usefulClarification": boolean, "repeatedClarification": boolean, "previouslyCorrected": boolean, "reason": "one short explanation", "criteria": {"logic": 0-100, "evidence": 0-100, "clarity": 0-100, "response": 0-100}}. Keep the reason in English, at the selected reading level, and at most 20 words. Judge the quality of reasoning, not whether the position agrees with you.`, { difficulty });
        const parsed = JSON.parse(evaluation.match(/\{[\s\S]*\}/)?.[0] || "{}");
        const assessedChange = normalizeConfidenceChange(parsed, difficulty);
        const nextScore = Math.max(0, Math.min(100, confidence + assessedChange));
        const change = nextScore - confidence;
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
    const html = highlightBibleCitations(bridge.format(spacedText));
    return roomFactCheck
      ? html.replace(/\[\[FACT\]\]([\s\S]*?)\[\[\/FACT\]\]/g, '<mark class="debate-fact-check">$1</mark>')
      : html.replace(/\[\[FACT\]\]|\[\[\/FACT\]\]/g, "");
  };

  return (
    <>
    <div className="apologetics-debate-room">
      <header className="apologetics-debate-room-header">
        <button className="apologetics-debate-back" type="button" onClick={leaveRoom} aria-label="Back to debate setup">←</button>
        <div>
          <nav className="think-room-breadcrumb" aria-label="Current path">
            <span>Think room</span><i aria-hidden="true">/</i><strong>Debate room</strong>
          </nav>
        </div>
      </header>

      <div className="apologetics-debate-room-settings">
        <div className="apologetics-debate-room-info">
          <button className="apologetics-debate-room-info-toggle" type="button" onMouseDown={(event) => event.preventDefault()} onClick={toggleRoomInfo} aria-expanded={roomInfoOpen} aria-controls="debate-room-information">
            <span>Room information</span>
            <span className={`apologetics-debate-room-info-arrow${roomInfoOpen ? " is-open" : ""}`} aria-hidden="true">⌄</span>
          </button>
          {roomInfoOpen && (
            <div className="apologetics-debate-room-context" id="debate-room-information">
              <span>Difficulty: <strong>{difficulty}</strong></span>
              <span>Personality: <strong>{selectedPersonality.label}</strong></span>
              <span>Theme: <strong>{theme?.label || "General"}</strong></span>
              {theme?.topics?.[theme.questions.indexOf(question)] && <span>Topic: <strong>{theme.topics[theme.questions.indexOf(question)]}</strong></span>}
              <span>Question: <strong>{question || generalQuestion}</strong></span>
            </div>
          )}
        </div>
        <div className="apologetics-debate-room-info">
          <button className="apologetics-debate-room-info-toggle" type="button" onClick={() => setScoringTableOpen((open) => !open)} aria-expanded={scoringTableOpen} aria-controls="debate-scoring-table">
            <span id="debate-scoring-table-title">Confidence points - scoring table</span>
            <span className={`apologetics-debate-room-info-arrow${scoringTableOpen ? " is-open" : ""}`} aria-hidden="true">⌄</span>
          </button>
          {scoringTableOpen && (
            <div className="debate-scoring-guide" id="debate-scoring-table">
              <div className="debate-scoring-table-scroll" role="region" aria-label="Scoring rules by difficulty" tabIndex={0}>
                <table className="debate-scoring-table" aria-labelledby="debate-scoring-table-title">
                  <thead>
                    <tr>
                      <th scope="col">Difficulty</th>
                      {[...confidenceScoringRows].reverse().map(({ points }) => (
                        <th scope="col" key={points} className={`debate-score-column--${points > 0 ? "positive" : points < 0 ? "negative" : "neutral"}`}>{points > 0 ? `+${points}` : points < 0 ? `−${Math.abs(points)}` : "0"}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {debateDifficulties.map((level, index) => (
                      <tr key={level} aria-current={level === difficulty ? "true" : undefined}>
                        <th scope="row">{level}</th>
                        {[...confidenceScoringRows].reverse().map(({ points, descriptions }) => <td key={points}>{descriptions[index]}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="debate-confidence-carousel-group">
        <div className="debate-confidence-pages" aria-label="Carousel pages">
          {["Confidence", "Debate tools"].map((label, index) => (
            <button type="button" key={label} aria-label={`Show ${label}`} aria-current={confidencePage === index ? "true" : undefined} onClick={() => {
              const carousel = confidenceCarouselRef.current;
              if (carousel) carousel.scrollTo({ left: index * carousel.clientWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
            }}><span aria-hidden="true" /></button>
          ))}
        </div>
        <div className="debate-confidence-carousel" ref={confidenceCarouselRef} role="region" aria-label="Confidence and debate tools" onScroll={(event) => {
          const width = event.currentTarget.clientWidth;
          if (width) setConfidencePage(Math.round(event.currentTarget.scrollLeft / width));
        }}>
      <section className="apologetics-debate-progress debate-confidence-slide" aria-label="Debate progress">
        <button className="apologetics-debate-progress-main" type="button" onClick={() => setConfidenceOpen((current) => !current)} aria-expanded={confidenceOpen}>
          <div className="apologetics-debate-progress-ring" style={{ "--confidence": confidence }}>{confidence}%</div>
          <div><strong>Confidence</strong><p>Neutral starting point. Build your case.</p></div>
          <div className="apologetics-debate-level"><strong>Level {levelProgress.level}</strong><span>{levelProgress.requiredXp ? `${levelProgress.currentXp} / ${levelProgress.requiredXp} XP` : `${levelProgress.currentXp} XP`}</span><i><b style={{ width: `${levelProgress.progress}%` }}></b></i></div>
        </button>

      </section>

      <div className="debate-confidence-slide debate-confidence-tools-slide" aria-label="Debate tools">
        <div className="apologetics-debate-tools" aria-label="Debate tools">
          <button type="button" onClick={openHints}><span><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 0 0-4 0v5" /><path d="M14 10V4a2 2 0 0 0-4 0v6" /><path d="M10 10V5a2 2 0 0 0-4 0v7" /><path d="M6 12V8a2 2 0 0 0-4 0v8c0 3.3 2.7 6 6 6h4a6 6 0 0 0 6-6v-5Z" /></svg></span><strong>Hints</strong><b>›</b></button>
          <button type="button" onClick={openVerseSupport}><span><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 3H20v18H6.5A2.5 2.5 0 0 0 4 23.5v-18A2.5 2.5 0 0 1 6.5 3Z" /><path d="M8 7h8M8 11h6" /></svg></span><strong>Verse support</strong><b>›</b></button>
          <button type="button" onClick={openBetterAnswer}><span>☆</span><strong>Better answer</strong><b>›</b></button>
          <button className={roomFactCheck ? "is-on" : ""} type="button" onClick={() => setRoomFactCheck((current) => !current)} aria-pressed={roomFactCheck}><span>✓</span><strong>Fact-check</strong><b>{roomFactCheck ? "On" : "Off"}</b></button>
        </div>
      </div>

        </div>

        {confidenceOpen && confidencePage === 0 && (
          <div className="apologetics-debate-confidence-journal">
            <div className="apologetics-debate-confidence-journal-heading"><strong>Score journal</strong></div>
            {confidenceJournal.length ? confidenceJournal.slice().reverse().map((entry, index) => <div className="apologetics-debate-confidence-entry" key={`${entry.score}-${index}`}><b>{entry.score}%</b><div><strong>{entry.change >= 0 ? `+${entry.change}` : entry.change} pts</strong><p>{entry.reason}</p></div></div>) : <div className="apologetics-debate-confidence-entry"><b>50%</b><div><strong>Neutral baseline</strong><p>Every debate starts here. Your score changes as your answers are evaluated.</p></div></div>}
            <div className="apologetics-debate-confidence-criteria"><span>Logic</span><span>Evidence</span><span>Clarity</span><span>Response</span></div>
          </div>
        )}
      </div>

      <div className="chat-thread apologetics-debate-chat-thread" ref={threadRef} aria-label="Debate conversation">
        {messages.map((message, index) => <AiMessage key={`${message.role}-${index}-${message.text}`} message={message} bridge={bridge} formatText={formatDebateText} pendingLabel="Your debate partner is thinking..." showAvatar showName name={`AI Brother ${selectedPersonality.label}`} />)}
      </div>

    </div>
    {isDebateScreenActive && createPortal(
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
  const [opponentPersonality, setOpponentPersonality] = useState("");
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
  const questions = theme ? theme.questions : [];

  if (isRoomOpen) {
    return <DebateRoomView theme={theme} question={question} difficulty={difficulty} opponentPersonality={opponentPersonality} factCheck={factCheck} savedMessages={resumeDebate?.messages} onBack={() => { setSavedDebate(getLatestDebateConversation()); setResumeDebate(null); setIsRoomOpen(false); }} />;
  }

  return (
    <div className="apologetics-debate-content">
      <header className="apologetics-debate-header">
        <button className="apologetics-debate-back" type="button" onClick={goBack} aria-label="Back to Apologetics">←</button>
        <div>
          <nav className="think-room-breadcrumb" aria-label="Current path">
            <span>Think room</span><i aria-hidden="true">/</i><strong>Debate room</strong>
          </nav>
        </div>
      </header>

      <nav className="apologetics-debate-setup-progress" aria-label="Debate setup progress">
        <span className={theme ? "is-complete" : ""}><b>1</b><small>Beliefs</small></span>
        <i aria-hidden="true"></i>
        <span className={question ? "is-complete" : ""}><b>2</b><small>Questions</small></span>
        <i aria-hidden="true"></i>
        <span className={difficulty ? "is-complete" : ""}><b>3</b><small>Difficulty</small></span>
        <i aria-hidden="true"></i>
        <span className={opponentPersonality ? "is-complete" : ""}><b>4</b><small>Personality</small></span>
      </nav>

      <section className="apologetics-debate-step apologetics-debate-step--theme" aria-labelledby="debate-theme-title">
        <div className="apologetics-debate-step-heading">
          <span>1</span>
          <div>
            <h2 id="debate-theme-title">Choose your topic</h2>
            <p>Choose the belief or perspective you want to defend.</p>
          </div>
        </div>
        <div className="apologetics-debate-theme-list">
          {debateThemes.map((item) => (
            <button className={themeId === item.id ? "is-selected" : ""} key={item.id} type="button" onClick={(event) => {
              const nextThemeId = themeId === item.id ? "" : item.id;
              setThemeId(nextThemeId);
              setQuestion("");
              if (nextThemeId) {
                const card = event.currentTarget;
                window.requestAnimationFrame(() => {
                  const carousel = card.parentElement;
                  if (!carousel) return;
                  carousel.scrollTo({
                    left: Math.max(0, card.offsetLeft - (carousel.clientWidth - card.offsetWidth) / 2),
                    behavior: "smooth",
                  });
                });
              }
            }} aria-pressed={themeId === item.id}>
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="apologetics-debate-step apologetics-debate-setup-settings apologetics-debate-question-settings" aria-labelledby="debate-question-title">
        <div className="apologetics-debate-setup-heading">
          <span>2</span>
          <div>
            <h2 id="debate-question-title">Choose the question</h2>
            <p>{theme ? `Pick the question you want to explore for ${theme.label}.` : ""}</p>
          </div>
        </div>
        {theme ? <DebateQuestionCarousel questions={questions} topics={theme?.topics} value={question} onChange={setQuestion} /> : <div className="apologetics-debate-question-awaiting" aria-hidden="true" />}
      </section>

      <section className="apologetics-debate-step apologetics-debate-setup-settings" aria-labelledby="debate-difficulty-title">
        <div className="apologetics-debate-setup-heading">
          <span>3</span>
          <div>
            <h2 id="debate-difficulty-title">Choose the difficulty</h2>
            <p>Set how challenging you want the conversation to be.</p>
          </div>
        </div>
        <div className="apologetics-debate-difficulty-list">{debateDifficulties.map((level) => <button className={difficulty === level ? "is-selected" : ""} type="button" key={level} onClick={() => setDifficulty((current) => current === level ? "" : level)}>{level}</button>)}</div>
        <DifficultyGuidance difficulty={difficulty} />
      </section>

      <section className="apologetics-debate-step apologetics-debate-setup-settings apologetics-debate-personality-settings" aria-labelledby="opponent-personality-title">
        <div className="apologetics-debate-setup-heading">
          <span>4</span>
          <div>
            <h2 id="opponent-personality-title">Choose the personality</h2>
            <p>Choose the tone and attitude of your opponent.</p>
          </div>
        </div>
        <div className="apologetics-debate-personality-list">
          {opponentPersonalities.map((personality) => (
            <button className={opponentPersonality === personality.id ? "is-selected" : ""} type="button" key={personality.id} onClick={(event) => {
              const nextPersonality = opponentPersonality === personality.id ? "" : personality.id;
              setOpponentPersonality(nextPersonality);
              if (nextPersonality) {
                const card = event.currentTarget;
                window.requestAnimationFrame(() => {
                  const carousel = card.parentElement;
                  if (!carousel) return;
                  carousel.scrollTo({
                    left: Math.max(0, card.offsetLeft - (carousel.clientWidth - card.offsetWidth) / 2),
                    behavior: "smooth",
                  });
                });
              }
            }} aria-pressed={opponentPersonality === personality.id}>
              {personality.label}
            </button>
          ))}
        </div>
        <p className="apologetics-debate-personality-description">{opponentPersonalities.find((item) => item.id === opponentPersonality)?.description}</p>
      </section>

      <div className={`apologetics-debate-actions${savedDebate ? " has-continue" : ""}`}>
        <button className="apologetics-debate-launch" type="button" disabled={!theme || !question || !difficulty || !opponentPersonality} onClick={() => {
          const newDebate = startNewDebateConversation(theme, question, difficulty, factCheck, opponentPersonality);
          setSavedDebate(newDebate);
          setResumeDebate(newDebate);
          setIsRoomOpen(true);
        }}>
          Start debate
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
            Continue my debate
          </button>
        )}
      </div>
    </div>
  );
}

export function ThinkRoomResume() {
  const [saved, setSaved] = useState(() => getLatestDebateConversation());
  useEffect(() => {
    const refresh = () => setSaved(getLatestDebateConversation());
    const screenChanged = event => { if (event.detail?.id === 'apologetics') refresh(); };
    const storageChanged = event => { if (!event.key || event.key.startsWith('brother.debateConversation.')) refresh(); };
    document.addEventListener('debate:conversation-change', refresh);
    window.addEventListener('app:screen-change', screenChanged);
    window.addEventListener('storage', storageChanged);
    return () => {
      document.removeEventListener('debate:conversation-change', refresh);
      window.removeEventListener('app:screen-change', screenChanged);
      window.removeEventListener('storage', storageChanged);
    };
  }, []);
  const theme = debateThemes.find(theme => theme.id === saved?.themeId);
  if (!saved || !theme) return null;
  const confidence = Number.isFinite(saved.confidence) ? Math.max(0, Math.min(100, saved.confidence)) : 50;
  return <button className="think-room-resume" type="button" onClick={() => {
    window.appNavigate?.('apologetics-debate');
    document.dispatchEvent(new CustomEvent('debate:open-latest'));
  }}>
    <span className="think-room-resume-copy"><strong>Continue my debate</strong><small>{theme.label}</small></span>
    <span className="think-room-resume-score">
      <span className="apologetics-debate-progress-ring" style={{ "--confidence": confidence }} aria-label={`Confidence: ${confidence}%`}>{confidence}%</span>
      <small>Confidence</small>
    </span>
    <span className="think-room-resume-arrow" aria-hidden="true">→</span>
  </button>;
}
