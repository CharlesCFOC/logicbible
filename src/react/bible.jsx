import React, { useEffect, useRef, useState } from "react";

const searchIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10.8" cy="10.8" r="6.8" />
    <path d="m16 16 5 5" />
  </svg>
);

const columnsIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="6" height="16" rx="1" />
    <rect x="14" y="4" width="6" height="16" rx="1" />
  </svg>
);

const targetIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="7" />
    <circle cx="12" cy="12" r="2" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </svg>
);

const verseActionIcons = {
  highlight: ["m4 20 11.5-11.5", "m14 5 5 5", "M4 20h4l11-11-4-4L4 16z"],
  "ask-ai": ["m12 3-1.3 5.7L5 10l5.7 1.3L12 17l1.3-5.7L19 10l-5.7-1.3z"],
  note: ["M5 3h14v18H5z", "M8 7h8", "M8 11h8", "M8 15h5"],
  copy: ["M8 8h11v12H8z", "M5 16H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v1"],
  share: ["M18 8a3 3 0 1 0-2.8-4", "M6 15a3 3 0 1 0 2.8 4", "m8.5 13.5 7-4", "m8.5 10.5 7 4"],
  bookmark: ["M6 4.5A2.5 2.5 0 0 1 8.5 2H18v19l-6-3-6 3z"],
  "original-language": ["M4 5h16", "M4 12h16", "M4 19h16", "M8 5v14", "M16 5v14"],
};

function VerseActionIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {verseActionIcons[name].map((path) => <path key={path} d={path} />)}
    </svg>
  );
}

function useBibleReaderState() {
  const bridge = window.bibleReaderBridge;
  const [state, setState] = useState(() => bridge.getSnapshot());

  useEffect(() => {
    const handleChange = () => setState(bridge.getSnapshot());
    document.addEventListener("bible:reader-change", handleChange);
    return () => document.removeEventListener("bible:reader-change", handleChange);
  }, [bridge]);

  return [state, bridge];
}

export function BibleReaderControls() {
  const [state, bridge] = useBibleReaderState();

  return (
    <>
      <label className="reader-select-label" aria-label="Bible version">
        <select value={state.versionId} onChange={(event) => bridge.setVersion(event.target.value)}>
          {state.versionOptions.map((option) => option.separator
            ? <option key="separator" disabled value="">────────────</option>
            : <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
      </label>
      <label className="reader-select-label" aria-label="Book">
        <select value={state.bookId} onChange={(event) => bridge.setBook(event.target.value)}>
          {state.books.map((book) => <option key={book.id} value={book.id}>{book.name}</option>)}
        </select>
      </label>
      <label className="reader-select-label compact" aria-label="Chapter">
        <select value={String(state.chapter)} onChange={(event) => bridge.setChapter(Number(event.target.value))}>
          {state.chapters.map((chapter) => <option key={chapter} value={chapter}>{chapter}</option>)}
        </select>
      </label>
      <button className="icon-button" type="button" data-open-search aria-label="Search Scripture">
        {searchIcon}
      </button>
    </>
  );
}

export function BibleParallelControls() {
  const [state, bridge] = useBibleReaderState();

  return (
    <>
      <button className={`parallel-toggle${state.parallelEnabled ? " is-active" : ""}`} type="button" onClick={bridge.toggleParallel}>
        {columnsIcon}
        <span>Parallèle</span>
      </button>
      <button className={`parallel-toggle reader-target-toggle${state.showHighlightsOnly ? " is-active" : ""}`} type="button" onClick={bridge.toggleTarget}>
        {targetIcon}
        <span>Cible</span>
      </button>
      <div className="parallel-selects" hidden={!state.parallelEnabled}>
        <label aria-label="Compare with Bible version">
          <select value={state.parallelVersionId} onChange={(event) => bridge.setParallelVersion(event.target.value)}>
            <option value="">Comparer avec</option>
            {state.parallelOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
        </label>
      </div>
    </>
  );
}

function useVerseUiState() {
  const bridge = window.bibleReaderBridge;
  const [state, setState] = useState(() => bridge.getVerseSnapshot());

  useEffect(() => {
    const handleChange = () => setState(bridge.getVerseSnapshot());
    document.addEventListener("bible:verse-ui-change", handleChange);
    return () => document.removeEventListener("bible:verse-ui-change", handleChange);
  }, [bridge]);

  return [state, bridge];
}

export function BibleSelectedVerse() {
  const [state] = useVerseUiState();
  return <>{state.reference}</>;
}

export function BibleSheetFeedback() {
  const [state] = useVerseUiState();
  return <>{state.feedback}</>;
}

export function BibleVerseActions() {
  const [state, bridge] = useVerseUiState();
  const actions = [
    ["highlight", "Highlight", "action-featured action-primary"],
    ["ask-ai", "Ask AI", "action-featured action-primary"],
    ["note", "Note", "action-featured action-primary"],
    ["copy", "Copy", "action-secondary"],
    ["share", "Share", "action-secondary"],
    ["bookmark", "Bookmark", "action-secondary"],
    ["original-language", state.languageLabel || "Greek", "action-secondary"],
  ];

  return actions.map(([id, label, baseClass]) => (
    <button className={`${baseClass}${state.active[id] ? " is-active" : ""}`} key={id} type="button" data-verse-action={id} onClick={() => bridge.runAction(id)}>
      <VerseActionIcon name={id} />
      <span>{label}</span>
    </button>
  ));
}

function useBibleChapterState() {
  const bridge = window.bibleReaderBridge;
  const [state, setState] = useState(() => bridge.getChapterSnapshot());
  const [verseState, setVerseState] = useState(() => bridge.getVerseSnapshot());

  useEffect(() => {
    const handleChapterChange = () => setState(bridge.getChapterSnapshot());
    const handleVerseChange = () => setVerseState(bridge.getVerseSnapshot());
    document.addEventListener("bible:chapter-change", handleChapterChange);
    document.addEventListener("bible:verse-ui-change", handleVerseChange);
    return () => {
      document.removeEventListener("bible:chapter-change", handleChapterChange);
      document.removeEventListener("bible:verse-ui-change", handleVerseChange);
    };
  }, [bridge]);

  return { state, verseState, bridge };
}

function BibleVerseLine({ verse, selection, bridge }) {
  const longPressTimer = useRef(null);
  const longPressTriggered = useRef(false);
  const clearLongPress = () => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  };
  const startLongPress = () => {
    clearLongPress();
    longPressTriggered.current = false;
    longPressTimer.current = window.setTimeout(() => {
      longPressTriggered.current = true;
      bridge.startMultiSelect(verse);
    }, 550);
  };
  const handleClick = () => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    bridge.selectVerse(verse);
  };
  const className = [
    "scripture-line",
    verse.highlighted ? "is-highlighted" : "",
    verse.bookmarked ? "is-bookmarked" : "",
    verse.noted ? "is-noted" : "",
    selection.selectedKey === verse.key ? "is-selected" : "",
    selection.selectedKeys.includes(verse.key) ? "is-multi-selected" : "",
  ].filter(Boolean).join(" ");

  return (
    <p
      className={className}
      style={verse.highlightColor ? { "--highlight-color": verse.highlightColor } : undefined}
      data-verse={verse.reference}
      data-highlight-key={verse.highlightKey}
      data-verse-key={verse.key}
      data-verse-number={verse.number || ""}
      data-verse-version={verse.version}
      data-verse-text={verse.text}
      onClick={handleClick}
      onPointerDown={startLongPress}
      onPointerUp={clearLongPress}
      onPointerCancel={clearLongPress}
      onPointerLeave={clearLongPress}
    >
      {verse.number ? <sup>{verse.number}</sup> : null}{verse.text}
    </p>
  );
}

function BibleEmptyState({ state }) {
  if (state.status === "loading") return <p className="reader-empty">Loading chapter...</p>;
  if (state.status === "error") return <div className="reader-empty"><strong>Could not load this version.</strong><span>{state.error}</span></div>;
  if (!state.verses.length) {
    return <div className="reader-empty"><strong>{state.title}</strong><span>{state.copyright}</span></div>;
  }
  return <div className="reader-empty"><strong>Aucun verset highlighté dans ce chapitre.</strong><span>Highlight un verset, puis utilise Cible pour l’isoler ici.</span></div>;
}

function BibleParallelContent({ state, selection, bridge }) {
  return (
    <div className="parallel-scripture-grid">
      <div className="parallel-version-headers" aria-label="Bible versions">
        <div className="parallel-version-header is-primary"><span>Current version</span><strong>{state.parallel.primary.label}</strong><small>{state.parallel.primary.name}</small></div>
        <div className="parallel-version-header is-compare"><span>Compared version</span><strong>{state.parallel.compare.label}</strong><small>{state.parallel.compare.name}</small></div>
      </div>
      {state.parallel.rows.map((verse) => (
        <article
          className={`parallel-scripture-line${verse.highlighted ? " is-highlighted" : ""}${verse.bookmarked ? " is-bookmarked" : ""}${verse.noted ? " is-noted" : ""}${selection.selectedKey === verse.key ? " is-selected" : ""}${selection.selectedKeys.includes(verse.key) ? " is-multi-selected" : ""}`}
          style={verse.highlightColor ? { "--highlight-color": verse.highlightColor } : undefined}
          data-verse={verse.reference}
          data-highlight-key={verse.highlightKey}
          data-verse-key={verse.key}
          data-verse-number={verse.number || ""}
          data-verse-version={verse.version}
          data-verse-text={verse.text}
          onClick={() => bridge.selectVerse(verse)}
          key={verse.key}
        >
          <p className="parallel-scripture-column" data-parallel-role="primary" aria-label={state.parallel.primary.label}>{verse.number ? <sup>{verse.number}</sup> : null}{verse.text}</p>
          <p className="parallel-scripture-column" data-parallel-role="compare" aria-label={state.parallel.compare.label}>{verse.number ? <sup>{verse.number}</sup> : null}{verse.comparisonText}</p>
        </article>
      ))}
    </div>
  );
}

function BibleChapterNavigation({ state, bridge }) {
  const bookIndex = state.books.findIndex((book) => book.id === state.bookId);
  const atBibleBeginning = bookIndex <= 0 && state.chapter <= 1;
  const atBibleEnd = bookIndex >= state.books.length - 1 && state.chapter >= state.chapterCount;

  const goToChapter = (delta) => {
    bridge.changeChapter(delta);
    document.querySelector(".reader-screen")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav className="bible-chapter-navigation" aria-label="Chapter navigation">
      <button type="button" onClick={() => goToChapter(-1)} disabled={atBibleBeginning} aria-label="Previous chapter">
        <span aria-hidden="true">←</span>
      </button>
      <button type="button" onClick={() => goToChapter(1)} disabled={atBibleEnd} aria-label="Next chapter">
        <span aria-hidden="true">→</span>
      </button>
    </nav>
  );
}

export function BibleChapterContent() {
  const { state, verseState, bridge } = useBibleChapterState();
  if (state.status !== "ready" || !state.verses.length) return <BibleEmptyState state={state} />;
  const content = state.parallelEnabled && state.parallel
    ? <BibleParallelContent state={state} selection={verseState} bridge={bridge} />
    : state.verses.map((verse) => <BibleVerseLine key={verse.key} verse={verse} selection={verseState} bridge={bridge} />);
  return <>{content}<BibleChapterNavigation state={state} bridge={bridge} /></>;
}
