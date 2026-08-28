import React, { useEffect, useRef, useState } from "react";
import { AiComposer, AiMessage } from "./ai.jsx";
import { DebateQuestionCarousel, DifficultyGuidance, debateThemes, debateDifficulties, generalQuestion, getDebateLevelProgress } from "./apologetics-debate.jsx";

const coachKey = (theme, question) => `brother.coachConversation.${theme?.id || "general"}.${encodeURIComponent(question || generalQuestion)}`;

export function ApologeticsXpCard() {
  const [totalXp, setTotalXp] = useState(() => window.aiBridge?.getDebateXp?.() || 0);
  useEffect(() => {
    const updateXp = () => setTotalXp(window.aiBridge?.getDebateXp?.() || 0);
    document.addEventListener("debate:xp-change", updateXp);
    return () => document.removeEventListener("debate:xp-change", updateXp);
  }, []);
  const progress = getDebateLevelProgress(totalXp);
  return (
    <section className="apologetics-xp-card" aria-label="Apologetics XP progress">
      <div className="apologetics-xp-badge">{progress.level}</div>
      <div className="apologetics-xp-copy"><span>YOUR PROGRESS</span><strong>Level {progress.level}</strong><p>Keep building stronger answers.</p></div>
      <div className="apologetics-xp-total"><strong>{totalXp}</strong><span>total XP</span></div>
      <div className="apologetics-xp-track"><i style={{ width: `${progress.progress}%` }} /></div>
      <small>{progress.requiredXp ? `${progress.currentXp} / ${progress.requiredXp} XP to Level ${progress.level + 1}` : "Maximum level reached"}</small>
    </section>
  );
}

function readCoachMessages(theme, question) {
  try {
    const saved = JSON.parse(localStorage.getItem(coachKey(theme, question)) || "null");
    return saved?.messages?.length ? saved.messages : null;
  } catch {
    return null;
  }
}

function CoachRoom({ theme, question, difficulty, onBack }) {
  const bridge = window.aiBridge;
  const initialMessages = [{ role: "assistant", text: `Let's practice this together. I'll give you focused feedback on your answer about: ${question || generalQuestion}` }];
  const [messages, setMessages] = useState(() => readCoachMessages(theme, question) || initialMessages);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [roomInfoOpen, setRoomInfoOpen] = useState(false);
  const threadRef = useRef(null);

  useEffect(() => {
    const appShell = document.querySelector(".app-shell");
    appShell?.classList.add("is-debate-room");
    appShell?.classList.add("is-coach-room");
    return () => {
      appShell?.classList.remove("is-debate-room");
      appShell?.classList.remove("is-coach-room");
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(coachKey(theme, question), JSON.stringify({ themeId: theme?.id, question, difficulty, updatedAt: Date.now(), messages: messages.filter((message) => !message.pending && message.text) }));
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages, theme, question, difficulty]);

  const sendMessage = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || pending) return;
    const history = messages.filter((message) => !message.pending).slice(-12);
    setDraft("");
    setMessages((current) => [...current, { role: "user", text }, { role: "assistant", text: "", pending: true }]);
    setPending(true);
    try {
      const prompt = `Coach this apologetics practice response. Theme: ${theme?.label || "General"}. Central question: ${question || generalQuestion}. Difficulty: ${difficulty}. Start with one specific strength, then give up to two concrete improvements about logic, clarity, evidence, or biblical support. Do not write a complete replacement answer. Ask the user to reformulate their response in their own words, then give one focused next step. This is a coaching session, not a debate: do not act as an opponent or try to defeat the user. User response: ${text}`;
      const response = await bridge.sendCoach(prompt, history);
      setMessages((current) => [...current.slice(0, -1), { role: "assistant", text: response }]);
    } catch (error) {
      setMessages((current) => [...current.slice(0, -1), { role: "assistant", text: error.message || "The coach is unavailable right now." }]);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="apologetics-debate-room apologetics-coach-room">
      <header className="apologetics-debate-room-header">
        <button className="apologetics-debate-room-back" type="button" onClick={onBack} aria-label="Back to coach setup">←</button>
        <div><h1>Coach room</h1><p>Practice, improve, and try again.</p></div>
      </header>
      <div className="apologetics-debate-room-settings">
        <div className="apologetics-debate-room-info">
          <button className="apologetics-debate-room-info-toggle" type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => setRoomInfoOpen((current) => !current)} aria-expanded={roomInfoOpen} aria-controls="coach-room-information">
            <span>Room informations</span>
            <span className={`apologetics-debate-room-info-arrow${roomInfoOpen ? " is-open" : ""}`} aria-hidden="true">⌄</span>
          </button>
          {roomInfoOpen && (
            <div className="apologetics-debate-room-context" id="coach-room-information">
              <span>Difficulty: <strong>{difficulty}</strong></span>
              <span>Theme: <strong>{theme?.label || "General"}</strong></span>
              <span>Question: <strong>{question || generalQuestion}</strong></span>
            </div>
          )}
        </div>
      </div>
      <div className="chat-thread apologetics-debate-chat-thread" ref={threadRef} aria-label="Coach conversation">
        {messages.map((message, index) => <AiMessage key={`${message.role}-${index}-${message.text}`} message={message} bridge={bridge} pendingLabel="Your coach is thinking..." showAvatar />)}
      </div>
      <AiComposer value={draft} onChange={setDraft} onSubmit={sendMessage} placeholder="Write your answer..." ariaLabel="Write your answer" disabled={pending} className="apologetics-debate-composer apologetics-coach-composer" submitLabel="Send answer" />
    </div>
  );
}

export function ApologeticsCoachPage() {
  const [themeId, setThemeId] = useState("");
  const [question, setQuestion] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [roomOpen, setRoomOpen] = useState(false);
  const theme = debateThemes.find((item) => item.id === themeId);
  const questions = theme ? [generalQuestion, ...theme.questions] : [];

  if (roomOpen) return <CoachRoom theme={theme} question={question} difficulty={difficulty} onBack={() => setRoomOpen(false)} />;
  return (
    <div className="apologetics-debate-content apologetics-coach-setup">
      <header className="apologetics-debate-header"><button className="apologetics-debate-back" type="button" onClick={() => window.appNavigate?.("apologetics")} aria-label="Back to Apologetics">←</button><div><h1>Coach room</h1><p>Build your answer one step at a time.</p></div></header>
      <section className="apologetics-debate-step apologetics-debate-step--theme"><div className="apologetics-debate-step-heading"><span>01</span><div><h2>Choose a debate theme</h2><p>Select the perspective you want to practice.</p></div></div><div className="apologetics-debate-theme-list">{debateThemes.map((item) => <button className={themeId === item.id ? "is-selected" : ""} key={item.id} type="button" onClick={() => { setThemeId(themeId === item.id ? "" : item.id); setQuestion(""); }} aria-pressed={themeId === item.id}>{item.label}</button>)}</div><div className="apologetics-debate-setup-settings"><div><span>Difficulty</span><div className="apologetics-debate-difficulty-list">{debateDifficulties.map((level) => <button className={difficulty === level ? "is-selected" : ""} type="button" key={level} onClick={() => setDifficulty(level)}>{level}</button>)}</div><DifficultyGuidance difficulty={difficulty} /></div></div></section>
      {theme ? <section className="apologetics-debate-step apologetics-debate-step--questions"><div className="apologetics-debate-step-heading"><span>02</span><div><h2>Choose the central question</h2><p>Pick a question to practice with your coach.</p></div></div><DebateQuestionCarousel questions={questions} value={question} onChange={setQuestion} /></section> : <p className="apologetics-debate-empty">Choose a theme to unlock the coaching questions.</p>}
      <button className="apologetics-debate-launch" type="button" disabled={!theme || !question || !difficulty} onClick={() => setRoomOpen(true)}>Start coaching</button>
    </div>
  );
}
