import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AiIcon, AiMessage } from "./ai.jsx";

const debateThemes = [
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

const generalQuestion = "What is the strongest reason to believe the Christian message is true?";
const debateConversationTtl = 30 * 24 * 60 * 60 * 1000;
const debateDifficulties = ["Beginner", "Intermediate", "Advanced", "Hostile"];
const debateDifficultyDescriptions = {
  Beginner: "Simple objections and clear questions to help you learn the basics.",
  Intermediate: "Balanced counter-arguments that test your reasoning and biblical support.",
  Advanced: "Stronger objections, subtle assumptions, and challenging follow-up questions.",
  Hostile: "A highly persuasive opponent who may use flawed or misleading arguments to test your discernment.",
};

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

function saveDebateConversation(theme, question, messages, difficulty = "Intermediate", factCheck = false) {
  const cleanMessages = messages.filter((message) => !message.pending && message.text).slice(-40);
  localStorage.setItem(getDebateConversationKey(theme, question), JSON.stringify({ themeId: theme?.id, question, difficulty, factCheck, updatedAt: Date.now(), messages: cleanMessages }));
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

function DebateRoomView({ theme, question, difficulty, factCheck, onBack }) {
  const bridge = window.aiBridge;
  const initialMessages = [
    { role: "assistant", text: question || generalQuestion },
    { role: "assistant", text: "I’ll take the opposing side. Make your best case, and I’ll challenge it fairly." },
  ];
  const [messages, setMessages] = useState(() => readDebateConversation(theme, question) || initialMessages);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [verseSupportOpen, setVerseSupportOpen] = useState(false);
  const [verseSupportLoading, setVerseSupportLoading] = useState(false);
  const [verseSupportText, setVerseSupportText] = useState("");
  const [hintsOpen, setHintsOpen] = useState(false);
  const [hintsLoading, setHintsLoading] = useState(false);
  const [hintsText, setHintsText] = useState("");
  const [roomFactCheck, setRoomFactCheck] = useState(factCheck);
  const threadRef = useRef(null);

  useEffect(() => {
    const appShell = document.querySelector(".app-shell");
    appShell?.classList.add("is-debate-room");
    return () => appShell?.classList.remove("is-debate-room");
  }, []);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
    saveDebateConversation(theme, question, messages, difficulty, roomFactCheck);
  }, [messages, roomFactCheck]);

  useEffect(() => {
    if (!verseSupportOpen && !hintsOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setVerseSupportOpen(false);
        setHintsOpen(false);
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [verseSupportOpen, hintsOpen]);

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
      const context = `You are the user's respectful but serious opponent in a Christian apologetics debate room. Debate theme: ${theme?.label || "General"}. Central question: ${question || generalQuestion}. Difficulty: ${difficulty}. ${difficulty === "Hostile" ? "You may use plausible but intentionally flawed objections, but never fabricate a Bible quotation." : "Keep objections accurate and fair."} Your role is to try to defeat the user's position: identify assumptions, expose weaknesses, ask precise follow-up questions, and present the strongest reasonable counter-argument. Respond directly to the user's latest argument and keep the debate moving. Do not agree just to be encouraging. However, if the user's point is logically strong, well-supported, or difficult to refute, explicitly acknowledge that strength before continuing. Never invent evidence or Bible quotations. Stay charitable, calm, and intellectually honest. Do not give a complete replacement answer for the user; make the user defend and improve their own case. ${factCheckInstruction}`;
      const responseText = await bridge.sendDebate(`${context}\n\nUser response: ${text}`, history);
      setMessages((current) => [...current.slice(0, -1), { role: "assistant", text: responseText }]);
    } catch (error) {
      setMessages((current) => [...current.slice(0, -1), { role: "assistant", text: error.message || "AI is not available yet." }]);
    } finally {
      setPending(false);
    }
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
    const html = bridge.format(text);
    return roomFactCheck
      ? html.replace(/\[\[FACT\]\]([\s\S]*?)\[\[\/FACT\]\]/g, '<mark class="debate-fact-check">$1</mark>')
      : html.replace(/\[\[FACT\]\]|\[\[\/FACT\]\]/g, "");
  };

  return (
    <>
    <div className="apologetics-debate-room">
      <header className="apologetics-debate-room-header">
        <button className="apologetics-debate-room-back" type="button" onClick={onBack} aria-label="Back to debate setup">←</button>
        <div>
          <h1>Debat room</h1>
          <p>Practice real conversations with AI.</p>
          <small>{theme?.label || "General"} · {question || generalQuestion}</small>
        </div>
      </header>

      <div className="apologetics-debate-room-settings">
        <span>Difficulty: <strong>{difficulty}</strong></span>
        <button type="button" className={roomFactCheck ? "is-on" : ""} onClick={() => setRoomFactCheck((current) => !current)} aria-pressed={roomFactCheck}>
          Fact-check <b>{roomFactCheck ? "On" : "Off"}</b>
        </button>
      </div>

      <section className="apologetics-debate-progress" aria-label="Debate progress">
        <div className="apologetics-debate-progress-ring">72%</div>
        <div><strong>Confidence</strong><p>Keep going! You’re building stronger answers.</p></div>
        <div className="apologetics-debate-level"><strong>Level 3</strong><span>120 / 200 XP</span><i><b></b></i></div>
      </section>

      <div className="apologetics-debate-carousel" aria-label="Debate context and tools">
        <div className="apologetics-debate-context-card apologetics-debate-context-card--theme">
          <small>THEME</small>
          <strong>{theme?.label || "General"}</strong>
        </div>
        <div className="apologetics-debate-context-card apologetics-debate-context-card--question">
          <small>QUESTION</small>
          <strong>{question || generalQuestion}</strong>
        </div>
        <div className="apologetics-debate-tools" aria-label="Debate tools">
          <button type="button" onClick={openHints}><span>♧</span><strong>Hints</strong><b>›</b></button>
          <button type="button" onClick={openVerseSupport}><span>▢</span><strong>Verse support</strong><b>›</b></button>
          <button type="button" onClick={() => setDraft("Help me improve my answer.")}><span>☆</span><strong>Better answer</strong><b>›</b></button>
        </div>
      </div>

      <div className="chat-thread apologetics-debate-chat-thread" ref={threadRef} aria-label="Debate conversation">
        {messages.map((message, index) => <AiMessage key={`${message.role}-${index}-${message.text}`} message={message} bridge={bridge} formatText={formatDebateText} />)}
      </div>

    </div>
    {createPortal(
      <>
        <form className="composer apologetics-debate-composer" onSubmit={sendMessage}>
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows="1" placeholder="Type your response..." aria-label="Type your response" disabled={pending} />
          <button type="submit" aria-label="Send response" disabled={pending}><AiIcon name="send" /></button>
        </form>
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
      </>,
      document.querySelector(".phone-frame"),
    )}
    </>
  );
}

export function ApologeticsDebatePage() {
  const [themeId, setThemeId] = useState("");
  const [question, setQuestion] = useState("");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [factCheck, setFactCheck] = useState(false);
  const [isRoomOpen, setIsRoomOpen] = useState(false);
  const [savedDebate, setSavedDebate] = useState(() => getLatestDebateConversation());
  const theme = debateThemes.find((item) => item.id === themeId);

  const goBack = () => window.appNavigate?.("apologetics");
  const questions = theme ? [generalQuestion, ...theme.questions] : [];

  if (isRoomOpen) {
    return <DebateRoomView theme={theme} question={question} difficulty={difficulty} factCheck={factCheck} onBack={() => { setSavedDebate(getLatestDebateConversation()); setIsRoomOpen(false); }} />;
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
            <button className={themeId === item.id ? "is-selected" : ""} key={item.id} type="button" onClick={() => { setThemeId(item.id); setQuestion(""); }} aria-pressed={themeId === item.id}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="apologetics-debate-setup-settings">
          <div><span>Difficulty</span><div className="apologetics-debate-difficulty-list">{debateDifficulties.map((level) => <button className={difficulty === level ? "is-selected" : ""} type="button" key={level} onClick={() => setDifficulty(level)}>{level}</button>)}</div><p className="apologetics-debate-difficulty-description">{debateDifficultyDescriptions[difficulty]}</p></div>
        </div>
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
          <div className="apologetics-debate-question-list">
            {questions.map((item, index) => (
              <button className={question === item ? "is-selected" : ""} key={item} type="button" onClick={() => setQuestion(item)} aria-pressed={question === item}>
                <span>{index === 0 ? "General" : `Question ${index}`}</span>
                <strong>{item}</strong>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <p className="apologetics-debate-empty">Choose a theme to unlock the debate questions.</p>
      )}

      <button className="apologetics-debate-launch" type="button" disabled={!theme || !question} onClick={() => setIsRoomOpen(true)}>
        Lancer le debat
      </button>
      {savedDebate && (
        <button className="apologetics-debate-continue" type="button" onClick={() => {
          const savedTheme = debateThemes.find((item) => item.id === savedDebate.themeId);
          if (!savedTheme) return;
          setThemeId(savedTheme.id);
          setQuestion(savedDebate.question || generalQuestion);
          setDifficulty(savedDebate.difficulty || "Intermediate");
          setFactCheck(Boolean(savedDebate.factCheck));
          setIsRoomOpen(true);
        }}>
          Continuer mon debat
        </button>
      )}
    </div>
  );
}
