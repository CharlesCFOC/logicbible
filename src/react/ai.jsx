import React, { useEffect, useRef, useState } from "react";

const aiIcons = {
  edit: ["M12 20h9", "M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"],
  send: ["m22 2-7 20-4-9-9-4Z", "M22 2 11 13"],
  copy: ["M8 8h11v12H8z", "M5 16H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v1"],
  bookmark: ["M6 4.5A2.5 2.5 0 0 1 8.5 2H18v19l-6-3-6 3z"],
  arrow: ["M5 19 19 5", "M9 5h10v10"],
  ai: ["m12 3-1.3 5.7L5 10l5.7 1.3L12 17l1.3-5.7L19 10l-5.7-1.3z", "m5 17-.6 2.4L2 20l2.4.6L5 23l.6-2.4L8 20l-2.4-.6z", "m19 3-.5 1.5L17 5l1.5.5L19 7l.5-1.5L21 5l-1.5-.5z"],
};

const aiComposerPrompts = [
  "Have a question?",
  "Looking for a verse?",
  "Want to compare the meaning of a word?",
];

export function AiIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {aiIcons[name].map((path) => <path key={path} d={path} />)}
    </svg>
  );
}

export function AiComposer({ value, onChange, onSubmit, placeholder, ariaLabel, disabled = false, className = "", textareaClassName = "", submitLabel = "Send message" }) {
  const textareaRef = useRef(null);

  const resize = (textarea) => {
    textarea.style.height = "auto";
    const maxHeight = 180;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  };

  useEffect(() => {
    if (!textareaRef.current) return;
    if (!value) {
      textareaRef.current.style.height = "";
      textareaRef.current.style.overflowY = "hidden";
      return;
    }
    resize(textareaRef.current);
  }, [value]);

  return (
    <form className={`composer reusable-ai-composer${className ? ` ${className}` : ""}`} onSubmit={onSubmit}>
      <textarea
        ref={textareaRef}
        className={textareaClassName}
        value={value}
        onChange={(event) => { onChange(event.target.value); resize(event.currentTarget); }}
        rows="1"
        placeholder={placeholder}
        aria-label={ariaLabel}
        disabled={disabled}
      />
      <button type="submit" aria-label={submitLabel} disabled={disabled}>
        <AiIcon name="send" />
      </button>
    </form>
  );
}

export function AiMessage({ message, bridge, formatText, pendingLabel = "Brother AI is thinking...", showAvatar = false }) {
  if (message.role === "user") return <article className="message user-message"><p>{message.text}</p></article>;
  const messageId = bridge.messageId(message.text);
  return (
    <article className={`message ai-message${showAvatar ? " ai-message--with-avatar" : ""}`} data-ai-message-id={messageId}>
      {showAvatar && <span className="ai-message-avatar" aria-hidden="true"><AiIcon name="ai" /></span>}
      <div className="ai-message-stack">
        <div className={`message-body rich-text${message.pending ? " shining-text" : ""}`} dangerouslySetInnerHTML={{ __html: message.pending ? pendingLabel : (formatText ? formatText(message.text) : bridge.format(message.text)) }} />
        {!message.pending && (
          <div className="ai-message-actions">
            <button type="button" className="ai-action-button" onClick={() => bridge.copy(message.text)} aria-label="Copy response" title="Copy"><AiIcon name="copy" /></button>
            <button type="button" className={`ai-action-button${bridge.bookmarked(message.text) ? " is-active" : ""}`} onClick={() => bridge.bookmark(message.text)} aria-label="Bookmark response" title="Bookmark"><AiIcon name="bookmark" /></button>
          </div>
        )}
      </div>
    </article>
  );
}

export function AiPage() {
  const bridge = window.aiBridge;
  const initial = bridge.getSnapshot();
  const [tab, setTab] = useState(initial.tab);
  const [messages, setMessages] = useState(initial.messages);
  const [histories, setHistories] = useState(initial.histories);
  const [prompt, setPrompt] = useState("");
  const [promptIndex, setPromptIndex] = useState(0);
  const [promptFading, setPromptFading] = useState(false);
  const [pending, setPending] = useState(false);
  const threadRef = useRef(null);

  useEffect(() => {
    if (prompt.trim()) return undefined;
    const timer = window.setInterval(() => {
      setPromptFading(true);
      window.setTimeout(() => {
        setPromptIndex((current) => (current + 1) % aiComposerPrompts.length);
        setPromptFading(false);
      }, 260);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [prompt]);

  useEffect(() => {
    const handleChange = () => {
      const next = bridge.getSnapshot();
      setTab(next.tab);
      setHistories(next.histories);
    };
    const handlePrefill = (event) => setPrompt(event.detail?.prompt || "");
    document.addEventListener("ai:state-change", handleChange);
    document.addEventListener("ai:prefill", handlePrefill);
    return () => {
      document.removeEventListener("ai:state-change", handleChange);
      document.removeEventListener("ai:prefill", handlePrefill);
    };
  }, [bridge]);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages, tab]);

  useEffect(() => {
    document.querySelector("#ai")?.classList.toggle("is-history", tab === "history");
  }, [tab]);

  const send = async (event) => {
    event.preventDefault();
    const text = prompt.trim();
    if (!text || pending) return;
    const history = messages.filter((message) => !message.pending).slice(-24);
    setPrompt("");
    setTab("chat");
    setMessages((current) => [...current, { role: "user", text }, { role: "assistant", text: "", pending: true }]);
    setPending(true);
    try {
      const responseText = await bridge.send(text, history);
      setMessages((current) => [...current.slice(0, -1), { role: "assistant", text: responseText }]);
      setHistories(bridge.getSnapshot().histories);
    } catch (error) {
      setMessages((current) => [...current.slice(0, -1), { role: "assistant", text: error.message || "AI is not available yet." }]);
    } finally {
      setPending(false);
    }
  };

  const selectHistory = (id) => {
    const next = bridge.loadConversation(id);
    if (!next) return;
    setMessages(next);
    setTab("chat");
  };

  const newChat = () => {
    bridge.newConversation();
    setMessages([{ role: "assistant", text: "Ask me about a verse, doctrine, original language, cross references, or biblical context." }]);
    setPrompt("");
    setTab("chat");
  };

  return (
    <>
      <header className="ai-topbar">
        <div><strong>Brother AI</strong></div>
        <button className="icon-button" type="button" onClick={newChat} aria-label="New chat"><AiIcon name="edit" /></button>
      </header>
      <nav className="ai-tabs" aria-label="AI sections">
        <button className={tab === "chat" ? "is-active" : ""} type="button" onClick={() => setTab("chat")}>Chat</button>
        <button className={tab === "history" ? "is-active" : ""} type="button" onClick={() => setTab("history")}>History</button>
      </nav>
      <div className="chat-thread" ref={threadRef} hidden={tab === "history"}>
        {messages.map((message, index) => <AiMessage key={`${message.role}-${index}-${message.text}`} message={message} bridge={bridge} showAvatar />)}
      </div>
      <section className="ai-history-panel" hidden={tab !== "history"} aria-label="Conversation history">
        {histories.length ? histories.map((conversation) => (
          <button type="button" className="ai-history-item" key={conversation.id} onClick={() => selectHistory(conversation.id)}>
            <span>{conversation.preview}</span><AiIcon name="arrow" />
          </button>
        )) : <p className="ai-history-empty">No conversations in the last 24 hours.</p>}
        <p className="ai-history-retention">Conversations are saved for 24 hours after your last message.</p>
      </section>
      <AiComposer value={prompt} onChange={setPrompt} onSubmit={send} placeholder={aiComposerPrompts[promptIndex]} ariaLabel="Message Brother AI" disabled={pending} textareaClassName={promptFading ? "is-placeholder-fading" : ""} />
    </>
  );
}
