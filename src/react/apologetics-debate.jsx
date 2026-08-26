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

function saveDebateConversation(theme, question, messages) {
  const cleanMessages = messages.filter((message) => !message.pending && message.text).slice(-40);
  localStorage.setItem(getDebateConversationKey(theme, question), JSON.stringify({ themeId: theme?.id, question, updatedAt: Date.now(), messages: cleanMessages }));
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

function DebateRoomView({ theme, question, onBack }) {
  const bridge = window.aiBridge;
  const initialMessages = [
    { role: "assistant", text: question || generalQuestion },
    { role: "assistant", text: "Take your time, make your best case, and I’ll help you sharpen the answer." },
  ];
  const [messages, setMessages] = useState(() => readDebateConversation(theme, question) || initialMessages);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const threadRef = useRef(null);

  useEffect(() => {
    const appShell = document.querySelector(".app-shell");
    appShell?.classList.add("is-debate-room");
    return () => appShell?.classList.remove("is-debate-room");
  }, []);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
    saveDebateConversation(theme, question, messages);
  }, [messages]);

  const sendMessage = async (event) => {
    event.preventDefault();
    const text = draft.trim();
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
      const context = `You are the AI debate partner in a Christian apologetics debate room. Debate theme: ${theme?.label || "General"}. Central question: ${question || generalQuestion}. Give a clear, respectful, evidence-based response that helps the user practice apologetics.`;
      const responseText = await bridge.sendDebate(`${context}\n\nUser response: ${text}`, history);
      setMessages((current) => [...current.slice(0, -1), { role: "assistant", text: responseText }]);
    } catch (error) {
      setMessages((current) => [...current.slice(0, -1), { role: "assistant", text: error.message || "AI is not available yet." }]);
    } finally {
      setPending(false);
    }
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
          <button type="button" onClick={() => setDraft("Can you give me a helpful hint?")}><span>♧</span><strong>Hints</strong><b>›</b></button>
          <button type="button" onClick={() => setDraft("Show me a supporting Bible verse.")}><span>▢</span><strong>Verse support</strong><b>›</b></button>
          <button type="button" onClick={() => setDraft("Help me improve my answer.")}><span>☆</span><strong>Better answer</strong><b>›</b></button>
        </div>
      </div>

      <div className="chat-thread apologetics-debate-chat-thread" ref={threadRef} aria-label="Debate conversation">
        {messages.map((message, index) => <AiMessage key={`${message.role}-${index}-${message.text}`} message={message} bridge={bridge} />)}
      </div>

    </div>
    {createPortal(
      <form className="composer apologetics-debate-composer" onSubmit={sendMessage}>
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows="1" placeholder="Type your response..." aria-label="Type your response" disabled={pending} />
        <button type="submit" aria-label="Send response" disabled={pending}><AiIcon name="send" /></button>
      </form>,
      document.querySelector(".phone-frame"),
    )}
    </>
  );
}

export function ApologeticsDebatePage() {
  const [themeId, setThemeId] = useState("");
  const [question, setQuestion] = useState("");
  const [isRoomOpen, setIsRoomOpen] = useState(false);
  const [savedDebate, setSavedDebate] = useState(() => getLatestDebateConversation());
  const theme = debateThemes.find((item) => item.id === themeId);

  const goBack = () => window.appNavigate?.("apologetics");
  const questions = theme ? [generalQuestion, ...theme.questions] : [];

  if (isRoomOpen) {
    return <DebateRoomView theme={theme} question={question} onBack={() => { setSavedDebate(getLatestDebateConversation()); setIsRoomOpen(false); }} />;
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
          setIsRoomOpen(true);
        }}>
          Continuer mon debat
        </button>
      )}
    </div>
  );
}
