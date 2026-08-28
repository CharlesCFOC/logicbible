import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const categories = [
  ["general", "General"],
  ["family", "Family"],
  ["health", "Health"],
  ["work", "Work"],
  ["faith", "Faith"],
  ["other", "Other"],
];
const filterCategories = [["all", "All"], ...categories];

const backgrounds = [1, 2, 3, 4, 5, 6];

const icons = {
  send: ["m22 2-7 20-4-9-9-4Z", "M22 2 11 13"],
  share: ["M14 5h5v5", "M19 5l-9 9", "M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"],
  heart: ["M20.8 8.8c0 5.4-8.8 10.2-8.8 10.2S3.2 14.2 3.2 8.8A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.7Z"],
  handHeart: ["M20.8 8.8c0 5.4-8.8 10.2-8.8 10.2S3.2 14.2 3.2 8.8A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.7Z", "M7 15h4l2-3 2 2h3"],
  chevron: ["m6 9 6 6 6-6"],
};

function PrayerIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {icons[name].map((path) => <path key={path} d={path} />)}
    </svg>
  );
}

function usePrayerState() {
  const bridge = window.prayerBridge;
  const [state, setState] = useState(() => bridge.getSnapshot());
  useEffect(() => {
    const handleChange = () => setState(bridge.getSnapshot());
    document.addEventListener("prayer:state-change", handleChange);
    return () => document.removeEventListener("prayer:state-change", handleChange);
  }, [bridge]);
  return [state, bridge];
}

function PrayerCategories({ active, onChange, filter = false }) {
  return (
    <div className={filter ? "prayer-filter-row prayer-category-picker" : "prayer-category-picker"} role="group" aria-label="Prayer categories">
      {(filter ? filterCategories : categories).map(([id, label]) => (
        <button className={active === id ? "is-active" : ""} key={id} type="button" onClick={() => onChange(id)}>
          {label}
        </button>
      ))}
    </div>
  );
}

function PrayerRequestForm({ state, bridge }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [category, setCategory] = useState(state.requestCategory || "general");
  const [background, setBackground] = useState(state.backgroundIndex || 0);
  const [sending, setSending] = useState(false);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    const success = await bridge.submit(title, text, category, background);
    setSending(false);
    if (success) {
      setTitle("");
      setText("");
      setCategory("general");
      setBackground(0);
    }
  };

  return (
    <section className="prayer-request-panel">
      <article className="prayer-intro">
        <h2>What would you like us to pray for?</h2>
        <p>Share your request anonymously and let the community pray with you.</p>
      </article>
      <form className="prayer-compose" onSubmit={submit}>
        <div className="prayer-request-title-field">
          <input value={title} onChange={(event) => setTitle(event.target.value)} type="text" maxLength="120" placeholder="Prayer title" aria-label="Prayer title" required />
        </div>
        <div className="prayer-request-textarea">
          <textarea value={text} onChange={(event) => setText(event.target.value)} rows="5" maxLength="2200" placeholder="What would you like us to pray for?" required />
        </div>
        <div className="prayer-compose-options">
          <PrayerCategories active={category} onChange={setCategory} />
        </div>
        <div className="prayer-background-picker" role="group" aria-label="Choose prayer card background">
          <span className="prayer-background-picker-label">Choose a background</span>
          <div className="prayer-background-options">
            {backgrounds.map((number, index) => (
              <button className={background === index ? "is-active" : ""} type="button" key={number} onClick={() => setBackground(index)} aria-label={`Choose prayer background ${number}`} aria-pressed={background === index}>
                <img src={`assets/prayer-backgrounds/prayer-${number}.jpg`} alt="" loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
        </div>
        <div className="prayer-compose-footer">
          <small className={words > 300 ? "is-over-limit" : ""}>{words} / 300 words</small>
          <button type="submit" disabled={sending}><PrayerIcon name="send" /><span>{sending ? "Sending..." : state.sent ? "Sent" : "Send prayer request"}</span></button>
        </div>
        <p className="prayer-form-feedback" aria-live="polite">{state.feedback}</p>
      </form>
    </section>
  );
}

function PrayerCard({ request, bridge, index }) {
  const [isOpen, setIsOpen] = useState(false);
  const image = `assets/prayer-backgrounds/prayer-${request.backgroundIndex + 1}.jpg`;
  const title = request.title?.trim() || "Prayer request";

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  const share = (event) => {
    event.stopPropagation();
    bridge.share(request.id);
  };
  const pray = (event) => {
    event.stopPropagation();
    bridge.pray(request.id);
  };

  const modal = isOpen ? createPortal(
    <div className="prayer-detail-modal" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setIsOpen(false)}>
      <section className="prayer-detail-dialog" role="dialog" aria-modal="true" aria-labelledby={`prayer-detail-title-${request.id}`}>
        <div className="prayer-detail-image" style={{ backgroundImage: `url('${image}')` }} aria-hidden="true" />
        <div className="prayer-detail-content">
          <div className="prayer-detail-header">
            <span>Prayer request</span>
            <button type="button" className="prayer-detail-close" onClick={() => setIsOpen(false)} aria-label="Close prayer request">×</button>
          </div>
          <h2 id={`prayer-detail-title-${request.id}`}>{title}</h2>
          <p className="prayer-detail-text">{request.text}</p>
          <div className="prayer-detail-footer">
            <div className="prayer-card-actions">
              <button type="button" className="prayer-action prayer-action-secondary" onClick={share} aria-label="Share prayer request" title="Share"><PrayerIcon name="share" /></button>
              <button type="button" className={`prayer-action${request.hasPrayed ? " is-prayed" : ""}`} onClick={pray} aria-label={request.hasPrayed ? "Prayer count" : "I prayed"}>
                <PrayerIcon name="heart" />
                <span className="prayer-action-label">I prayed</span>
                <small className="prayer-action-count">{request.prayerCount}</small>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>,
    document.querySelector(".phone-frame") || document.body,
  ) : null;

  return (
    <>
      <article className={`prayer-card prayer-card--${index % 4}${request.expanded ? " is-expanded" : ""}${request.urgent ? " is-urgent" : ""}${request.isNewlyPrayed ? " is-prayed" : ""}`} style={{ "--prayer-card-image": `url('${image}')` }} onClick={() => setIsOpen(true)}>
      <button type="button" className="prayer-card-toggle" onClick={() => setIsOpen(true)} aria-label="Open prayer request">
        <span>
          <strong className="prayer-card-title">{title}</strong>
          <p className="prayer-card-preview">{request.expanded ? request.text : request.preview}</p>
        </span>
        <PrayerIcon name="chevron" />
      </button>
      <div className="prayer-card-meta">
        <div className="prayer-card-actions">
          <button type="button" className="prayer-action prayer-action-secondary" onClick={share} aria-label="Share prayer request" title="Share"><PrayerIcon name="share" /></button>
          <button type="button" className={`prayer-action${request.hasPrayed ? " is-prayed" : ""}`} onClick={pray} aria-label={request.hasPrayed ? "Prayer count" : "I prayed"}>
            <PrayerIcon name="heart" />
            <span>{request.prayerCount}</span>
          </button>
        </div>
      </div>
      </article>
      {modal}
    </>
  );
}

export function PrayerPage() {
  const [state, bridge] = usePrayerState();
  return (
    <>
      <header className="prayer-header"><div><h1>Prayer room</h1></div></header>
      <div className="prayer-page-tabs" role="tablist" aria-label="Prayer sections">
        <button className={state.pageTab === "board" ? "is-active" : ""} type="button" onClick={() => bridge.setPageTab("board")}>Prayer</button>
        <button className={state.pageTab === "request" ? "is-active" : ""} type="button" onClick={() => bridge.setPageTab("request")}>Prayer request</button>
      </div>
      {state.pageTab === "request" && <PrayerRequestForm state={state} bridge={bridge} />}
      {(state.pageTab === "board" || state.myWallExpanded) && (
        <section className="prayer-board-section">
          <div className="prayer-board-content">
            <div className="prayer-board-controls">
              <label className="prayer-sort">
                <span className="sr-only">Sort prayers</span>
                <select value={state.sort} onChange={(event) => bridge.setSort(event.target.value)}>
                  <option value="most">Most prayed</option>
                  <option value="least">Least prayed</option>
                  <option value="recent">Most recent</option>
                </select>
              </label>
              <PrayerCategories active={state.filter} onChange={bridge.setFilter} filter />
            </div>
            <section className="prayer-list" aria-live="polite">
              {state.requests.length ? state.requests.map((request, index) => <PrayerCard key={request.id} request={request} bridge={bridge} index={index} />) : <p className="prayer-empty">{state.pageTab === "request" ? "You have not posted any prayer requests yet." : "No prayer requests have been posted yet."}</p>}
            </section>
          </div>
        </section>
      )}
    </>
  );
}
