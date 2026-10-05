import React, { useEffect, useRef, useState } from "react";
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

function getHourBucket(timestamp = Date.now()) {
  return Math.floor(timestamp / (60 * 60 * 1000));
}

function getHourlyPrayerIndices(count, hourBucket, size = 3) {
  if (!count) return [];
  const indices = Array.from({ length: count }, (_, index) => index);
  let seed = hourBucket * 12.9898 + 78.233;
  for (let index = indices.length - 1; index > 0; index -= 1) {
    seed = Math.sin(seed) * 43758.5453;
    const random = seed - Math.floor(seed);
    const swapIndex = Math.floor(random * (index + 1));
    [indices[index], indices[swapIndex]] = [indices[swapIndex], indices[index]];
  }
  return indices.slice(0, Math.min(size, count));
}

function formatSpotlightCountdown(timestamp = Date.now()) {
  const seconds = Math.ceil(((60 * 60 * 1000) - (timestamp % (60 * 60 * 1000))) / 1000);
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

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
    // Supabase may finish loading before React attaches this listener. Read
    // the latest snapshot after subscribing so the prayer wall cannot stay
    // stuck on its initial empty state.
    handleChange();
    return () => {
      document.removeEventListener("prayer:state-change", handleChange);
    };
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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    const success = await bridge.submit(title, text, category, background, acceptedTerms);
    setSending(false);
    if (success) {
      setTitle("");
      setText("");
      setCategory("general");
      setBackground(0);
      setAcceptedTerms(false);
    }
  };

  return (
    <section className="prayer-request-panel">
      <article className="prayer-intro">
        <h2>What would you like us to pray for?</h2>
        <p>Share your request anonymously and let the community pray with you.</p>
      </article>
      <form className="prayer-compose" onSubmit={submit}>
        <p className="prayer-safety-reminder">Keep personal details private. Reported content can be reviewed and removed by an administrator.</p>
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
                <img src={`assets/prayer-backgrounds/prayer-${number}.webp`} alt="" loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
        </div>
        <label className="prayer-community-terms">
          <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} required />
          <span>I agree to the <a href="community-guidelines.html" target="_blank" rel="noreferrer">community rules</a>: no private contact details, bullying, sexual content, threats, or spam.</span>
        </label>
        <div className="prayer-compose-footer">
          <small className={words > 300 ? "is-over-limit" : ""}>{words} / 300 words</small>
          <button type="submit" disabled={sending}><PrayerIcon name="send" /><span>{sending ? "Sending..." : state.sent ? "Sent" : "Send prayer request"}</span></button>
        </div>
        <p className="prayer-form-feedback" aria-live="polite">{state.feedback}</p>
      </form>
    </section>
  );
}

const onlinePrayerMeetings = [
  {
    id: "morning",
    title: "Morning prayer",
    torontoStart: [5, 0],
    torontoEnd: [7, 0],
    url: "https://us06web.zoom.us/j/81740698791?pwd=I9YOloR8BybnNTf4khVQApuY2obgyl.1",
  },
  {
    id: "evening",
    title: "Evening prayer",
    torontoStart: [22, 0],
    torontoEnd: [23, 0],
    url: "https://us06web.zoom.us/j/81132108320?pwd=4JZzUaXk21paxbFa0D53AmIc9magq7.1",
  },
];

const torontoTimeZone = "America/Toronto";

function getTorontoDateParts(date = new Date()) {
  return Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: torontoTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date).filter(({ type }) => type !== "literal").map(({ type, value }) => [type, value]));
}

function getTorontoOffsetMinutes(date) {
  const offset = new Intl.DateTimeFormat("en-US", {
    timeZone: torontoTimeZone,
    timeZoneName: "shortOffset",
  }).formatToParts(date).find(({ type }) => type === "timeZoneName")?.value || "GMT-5";
  const match = offset.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return -300;
  const minutes = Number(match[2]) * 60 + Number(match[3] || 0);
  return match[1] === "+" ? minutes : -minutes;
}

function getLocalMeetingTime([hour, minute]) {
  const { year, month, day } = getTorontoDateParts();
  const torontoWallTime = Date.UTC(Number(year), Number(month) - 1, Number(day), hour, minute);
  const firstGuess = new Date(torontoWallTime);
  const utcTime = torontoWallTime - getTorontoOffsetMinutes(firstGuess) * 60 * 1000;
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(utcTime));
}

function getTorontoMeetingTimestamp(year, month, day, hour, minute) {
  const wallTime = Date.UTC(year, month - 1, day, hour, minute);
  let timestamp = wallTime - getTorontoOffsetMinutes(new Date(wallTime)) * 60 * 1000;
  timestamp = wallTime - getTorontoOffsetMinutes(new Date(timestamp)) * 60 * 1000;
  return timestamp;
}

function getNextPrayerMeeting(now) {
  const { year, month, day } = getTorontoDateParts(now);
  const candidates = [];
  for (let offset = 0; offset <= 2; offset += 1) {
    onlinePrayerMeetings.forEach((meeting) => {
      candidates.push({
        meeting,
        startsAt: getTorontoMeetingTimestamp(Number(year), Number(month), Number(day) + offset, ...meeting.torontoStart),
      });
    });
  }
  return candidates.filter((candidate) => candidate.startsAt > now.getTime()).sort((a, b) => a.startsAt - b.startsAt)[0];
}

function formatCountdown(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function OnlinePrayerPanel() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const nextPrayer = getNextPrayerMeeting(now);

  return (
    <section className="online-prayer-panel" aria-labelledby="online-prayer-title">
      <div className="online-prayer-intro">
        <h2 id="online-prayer-title">Join us online</h2>
      </div>
      {nextPrayer && <div className="online-prayer-countdown" role="status" aria-live="polite">
        <span>Next prayer time in:</span>
        <strong>{formatCountdown(nextPrayer.startsAt - now.getTime())}</strong>
        <small>{nextPrayer.meeting.title}</small>
      </div>}
      <div className="online-prayer-list">
        {onlinePrayerMeetings.map((meeting) => (
            <article className="online-prayer-card" key={meeting.id}>
              <div>
                <h3>{meeting.title}</h3>
                <p className="online-prayer-local-time"><span>Your location time</span>{getLocalMeetingTime(meeting.torontoStart)} – {getLocalMeetingTime(meeting.torontoEnd)}</p>
              </div>
            <a className="online-prayer-join" href={meeting.url} target="_blank" rel="noreferrer">Open Zoom</a>
          </article>
        ))}
      </div>
    </section>
  );
}

const prayerStatusLabels = {
  pending: "Pending review",
  rejected: "Not approved",
  archived: "Archived",
  answered: "Answered",
};

function PrayerCard({ request, bridge, index, currentUserId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("personal-information");
  const [reportDetails, setReportDetails] = useState("");
  const [reportFeedback, setReportFeedback] = useState("");
  const [reporting, setReporting] = useState(false);
  const pressTimer = useRef(null);
  const image = `assets/prayer-backgrounds/prayer-${request.backgroundIndex + 1}.webp`;
  const title = request.title?.trim() || "Prayer request";

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  useEffect(() => () => window.clearTimeout(pressTimer.current), []);

  const openModeration = () => {
    window.clearTimeout(pressTimer.current);
    setIsOpen(true);
    setReportOpen(true);
    navigator.vibrate?.(12);
  };

  const startLongPress = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    window.clearTimeout(pressTimer.current);
    pressTimer.current = window.setTimeout(openModeration, 550);
  };

  const cancelLongPress = () => window.clearTimeout(pressTimer.current);

  const share = (event) => {
    event.stopPropagation();
    bridge.share(request.id);
  };
  const pray = (event) => {
    event.stopPropagation();
    bridge.pray(request.id);
  };
  const submitReport = async (event) => {
    event.preventDefault();
    setReporting(true);
    setReportFeedback("");
    try {
      await bridge.report(request.id, reportReason, reportDetails);
      setReportFeedback("Report sent. Thank you for helping keep this space safe.");
      setReportOpen(false);
    } catch (error) {
      setReportFeedback(error.message || "This report could not be sent.");
    } finally {
      setReporting(false);
    }
  };
  const block = async () => {
    try {
      await bridge.block(request.ownerId);
      setIsOpen(false);
    } catch (error) {
      setReportFeedback(error.message || "This user could not be blocked.");
    }
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
              <button type="button" className={`prayer-action${request.hasPrayed ? " is-prayed" : ""}`} onClick={pray} aria-label={request.hasPrayed ? "You prayed for this request" : "Pray for this request"} aria-pressed={request.hasPrayed}>
                <PrayerIcon name="heart" />
                <span className="prayer-action-label">{request.hasPrayed ? "✓ You prayed" : "I prayed"}</span>
                <small className="prayer-action-count">{request.prayerCount}</small>
              </button>
            </div>
            <div className="prayer-safety-actions">
              <button type="button" onClick={() => setReportOpen((current) => !current)}>Report</button>
              {request.ownerId && request.ownerId !== currentUserId && <button type="button" onClick={block}>Hide this user</button>}
            </div>
            {reportOpen && <form className="prayer-report-form" onSubmit={submitReport}>
              <label><span>Reason</span><select value={reportReason} onChange={(event) => setReportReason(event.target.value)}><option value="personal-information">Private information</option><option value="bullying">Bullying or harassment</option><option value="sexual-content">Sexual content</option><option value="violence">Violence or threats</option><option value="spam">Spam</option><option value="other">Other</option></select></label>
              <label><span>Optional details</span><textarea value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} maxLength="500" rows="2" /></label>
              <button type="submit" disabled={reporting}>{reporting ? "Sending…" : "Send report"}</button>
            </form>}
            {reportFeedback && <p className="prayer-report-feedback" role="status">{reportFeedback}</p>}
          </div>
        </div>
      </section>
    </div>,
    document.querySelector(".phone-frame") || document.body,
  ) : null;

  return (
    <>
      <article className={`prayer-card prayer-card--${index % 4}${request.expanded ? " is-expanded" : ""}${request.urgent ? " is-urgent" : ""}${request.isNewlyPrayed ? " is-prayed" : ""}${isOpen ? " is-open" : ""}`} style={{ "--prayer-card-image": `url('${image}')` }} onClick={() => setIsOpen(true)} onPointerDown={startLongPress} onPointerUp={cancelLongPress} onPointerCancel={cancelLongPress} onPointerLeave={cancelLongPress} onContextMenu={(event) => { event.preventDefault(); openModeration(); }}>
      <button type="button" className="prayer-card-toggle" onClick={() => setIsOpen(true)} aria-label="Open prayer request">
        <span>
          <small className="prayer-card-category">{request.category || "General"}</small>
          <strong className="prayer-card-title">{title}</strong>
          {request.status !== "active" && <small className="prayer-card-status">{prayerStatusLabels[request.status] || request.status}</small>}
          <p className="prayer-card-preview">{request.expanded ? request.text : request.preview}</p>
        </span>
      </button>
      <div className="prayer-card-meta">
        <div className="prayer-card-actions">
          <button type="button" className={`prayer-action${request.hasPrayed ? " is-prayed" : ""}`} onClick={pray} aria-label={request.hasPrayed ? "Cancel prayer" : "Pray for this request"} aria-pressed={request.hasPrayed}>
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

function PrayerModerationQueue({ requests, bridge }) {
  const [feedback, setFeedback] = useState("");
  const [workingId, setWorkingId] = useState("");
  if (!requests.length) return null;
  const review = async (requestId, nextStatus) => {
    setWorkingId(requestId);
    setFeedback("");
    try {
      await bridge.moderate(requestId, nextStatus);
      setFeedback(nextStatus === "active" ? "Request approved." : "Request rejected.");
    } catch (error) {
      setFeedback(error.message || "This request could not be reviewed.");
    } finally {
      setWorkingId("");
    }
  };
  return <section className="prayer-moderation-queue" aria-label="Prayer moderation queue">
    <header><span>Moderation</span><strong>{requests.length} pending</strong></header>
    {requests.map((request) => <article key={request.id}><div><strong>{request.title || "Prayer request"}</strong><p>{request.preview || request.text}</p></div><div><button type="button" onClick={() => review(request.id, "active")} disabled={workingId === request.id}>Approve</button><button type="button" onClick={() => review(request.id, "rejected")} disabled={workingId === request.id}>Reject</button></div></article>)}
    {feedback && <p role="status">{feedback}</p>}
  </section>;
}

function PrayerSpotlight({ requests, bridge, hourBucket }) {
  const [now, setNow] = useState(() => Date.now());
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const dragStartX = useRef(null);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    setActiveIndex(0);
    setDragX(0);
  }, [hourBucket, requests.length]);
  if (!requests.length) return null;

  const move = (direction) => {
    setActiveIndex((current) => (current + direction + requests.length) % requests.length);
    setDragX(0);
  };

  const handlePointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragStartX.current = event.clientX;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (dragStartX.current === null) return;
    setDragX(Math.max(-120, Math.min(120, event.clientX - dragStartX.current)));
  };

  const handlePointerEnd = () => {
    if (dragStartX.current === null) return;
    const distance = dragX;
    dragStartX.current = null;
    if (Math.abs(distance) > 42 && requests.length > 1) {
      move(distance < 0 ? 1 : -1);
    } else {
      setDragX(0);
    }
  };

  return (
    <section className="prayer-spotlight-carousel" aria-label="Hourly prayer spotlight">
      <div
        className="prayer-spotlight-stack"
        aria-live="polite"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        style={{ "--prayer-spotlight-drag-x": `${dragX}px` }}
      >
        {[requests[activeIndex]].map((request) => {
          const title = request.title?.trim() || "Prayer request";
          return (
            <article
              className="prayer-spotlight prayer-spotlight-position-0 is-active"
              key={request.id}
              style={{ "--prayer-spotlight-image": "url('assets/prayer-spotlight-background.webp')" }}
            >
              <span className="prayer-spotlight-label">Next spotlight in <strong>{formatSpotlightCountdown(now)}</strong></span>
              <h2>{title}</h2>
              <p>{request.preview || request.text}</p>
              <footer>
                <span>{request.category || "General"}</span>
                <span>♥ {request.prayerCount} praying</span>
                <button className={request.hasPrayed ? "is-prayed" : ""} type="button" onClick={() => bridge.pray(request.id)} aria-pressed={request.hasPrayed}>
                  {request.hasPrayed ? "✓ You prayed" : "Pray now"}
                </button>
              </footer>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function PrayerPage() {
  const [state, bridge] = usePrayerState();
  const [query, setQuery] = useState("");
  const [spotlightHour, setSpotlightHour] = useState(() => getHourBucket());
  useEffect(() => {
    const delay = ((60 * 60 * 1000) - (Date.now() % (60 * 60 * 1000))) + 150;
    const timer = window.setTimeout(() => setSpotlightHour(getHourBucket()), delay);
    return () => window.clearTimeout(timer);
  }, [spotlightHour]);
  const visibleRequests = state.requests.filter((request) => `${request.title || ""} ${request.text || ""} ${request.category || ""}`.toLowerCase().includes(query.trim().toLowerCase()));
  const searchableSpotlightRequests = (state.spotlightRequests || state.requests).filter((request) => `${request.title || ""} ${request.text || ""} ${request.category || ""}`.toLowerCase().includes(query.trim().toLowerCase()));
  const spotlightIndices = getHourlyPrayerIndices(searchableSpotlightRequests.length, spotlightHour);
  const spotlightRequests = spotlightIndices.map((index) => searchableSpotlightRequests[index]);
  // The spotlight highlights one request; it must not remove it from the
  // "Recent prayers" wall. Otherwise a community with only one request shows
  // a count but an empty recent list.
  const recentRequests = visibleRequests;
  const emptyPrayerMessage = state.pageTab === "request"
    ? "You have not posted any prayer requests yet."
    : query.trim()
      ? "No prayer requests match your search."
      : state.filter !== "all"
        ? "No prayer requests match this category yet."
        : "No prayer requests have been posted yet.";
  return (
    <>
      <header className="prayer-header"><div><h1>Prayer room</h1><p>A place to pray together.</p></div></header>
      <div className="prayer-page-tabs" role="tablist" aria-label="Prayer sections">
        <button className={state.pageTab === "board" ? "is-active" : ""} type="button" onClick={() => bridge.setPageTab("board")}><span>Prayer</span></button>
        <button className={state.pageTab === "request" ? "is-active" : ""} type="button" onClick={() => bridge.setPageTab("request")}><span>Prayer request</span></button>
        <button className={state.pageTab === "online" ? "is-active" : ""} type="button" onClick={() => bridge.setPageTab("online")}><span>Online prayer</span></button>
      </div>
      {state.pageTab === "online" && <OnlinePrayerPanel />}
      {state.pageTab === "request" && <PrayerRequestForm state={state} bridge={bridge} />}
      {(state.pageTab === "board" || state.myWallExpanded) && (
        <>
          <PrayerSpotlight requests={spotlightRequests} bridge={bridge} hourBucket={spotlightHour} />
          <section className="prayer-board-section">
            <div className="prayer-board-content">
            <div className="prayer-board-controls">
              <label className="prayer-wall-search">
                <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>
                <span className="sr-only">Search prayers</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Search prayers" />
              </label>
              <PrayerCategories active={state.filter} onChange={bridge.setFilter} filter />
            </div>
            <div className="prayer-recent-heading"><h2>Recent prayers</h2><span>{visibleRequests.length} requests</span></div>
            <p className="prayer-report-tip">Press and hold a prayer card to report content.</p>
            <section className="prayer-list" aria-live="polite">
              {recentRequests.length ? recentRequests.map((request, index) => <PrayerCard key={request.id} request={request} bridge={bridge} index={index} currentUserId={state.currentUserId} />) : <p className="prayer-empty">{emptyPrayerMessage}</p>}
            </section>
            </div>
          </section>
        </>
      )}
    </>
  );
}
