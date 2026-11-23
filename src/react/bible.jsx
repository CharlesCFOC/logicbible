import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChapterQuiz } from "./chapter-quiz.jsx";
import { startBibleVoiceRecorder } from "../shared/bible-voice-recorder.js";
import { parseBibleReference } from "../shared/bible-reference.js";
import { requestBibleVoiceTranscript } from "./bible-voice-client.js";

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
  const chapterDialog = useRef(null);
  const pendingChapterPicker = useRef(null);
  const bookName = state.books.find(book => book.id === state.bookId)?.name || "Bible";

  const openChapters = () => {
    chapterDialog.current.showModal();
    const selected = chapterDialog.current.querySelector('[aria-current="true"]');
    selected?.focus({ preventScroll: true });
    selected?.scrollIntoView({ block: "nearest" });
  };

  useEffect(() => {
    // Wait for the chosen book's chapter grid to render before opening it.
    if (pendingChapterPicker.current !== state.bookId) return;
    pendingChapterPicker.current = null;
    openChapters();
  }, [state.bookId]);

  const chooseBook = (bookId) => {
    pendingChapterPicker.current = bookId;
    bridge.setBook(bookId);
  };

  const chooseChapter = (chapter) => {
    chapterDialog.current.close();
    bridge.setChapter(chapter);
    document.querySelector('[data-reader-chapter]')?.scrollIntoView({ block: "start", behavior: "instant" });
  };

  return (
    <>
      <BibleVoiceSearch />
      <label className="reader-select-label bible-glass-select" aria-label="Bible version">
        <select className="bible-glass-select-input" value={state.versionId} onChange={(event) => bridge.setVersion(event.target.value)}>
          {state.versionOptions.map((option) => option.separator
            ? <option key="separator" disabled value="">────────────</option>
            : <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
      </label>
      <label className="reader-select-label bible-glass-select" aria-label="Book">
        <select className="bible-glass-select-input" value={state.bookId} onChange={(event) => chooseBook(event.target.value)}>
          {state.books.map((book) => <option key={book.id} value={book.id}>{book.name}</option>)}
        </select>
      </label>
      <button className="reader-select-label compact bible-glass-select bible-chapter-picker-trigger" type="button" aria-label={`Choose chapter, current chapter ${state.chapter}`} aria-haspopup="dialog" onClick={openChapters}>
        <span>{state.chapter}</span>
      </button>
      <dialog className="bible-chapter-picker" ref={chapterDialog} aria-labelledby="bible-chapter-picker-title" onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
        <div className="bible-chapter-picker-content">
          <header><div><span className="bible-chapter-picker-eyebrow">CHOOSE A CHAPTER</span><h2 id="bible-chapter-picker-title">{bookName}</h2></div><button type="button" className="bible-chapter-picker-close" aria-label="Close chapter selection" onClick={() => chapterDialog.current.close()}>×</button></header>
          <p>Select a number to start reading.</p>
          <div className="bible-chapter-picker-grid">
            {state.chapters.map(chapter => <button key={chapter} type="button" aria-label={`${bookName} ${chapter}`} aria-current={chapter === state.chapter ? "true" : undefined} onClick={() => chooseChapter(chapter)}>{chapter}</button>)}
          </div>
          <footer>{state.chapters.length} chapters · Chapter {state.chapter} selected</footer>
        </div>
      </dialog>
      <button className="icon-button bible-glass-control bible-glass-search" type="button" data-bible-menu-toggle aria-label="Open Bible menu" aria-controls="bible-menu-drawer" aria-expanded="false">
        <span className="bible-glass-control-content"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></svg></span>
      </button>
    </>
  );
}

export function BibleVoiceSearch() {
  const [state, bridge] = useBibleReaderState();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [message, setMessage] = useState("");
  const [transcript, setTranscript] = useState("");
  const [levels, setLevels] = useState(Array(18).fill(.12));
  const recording = useRef(null);
  const requestController = useRef(null);

  const close = () => {
    recording.current?.cancel();
    recording.current = null;
    requestController.current?.abort();
    requestController.current = null;
    setOpen(false);
    setPhase("idle");
  };
  useEffect(() => () => {
    recording.current?.cancel();
    requestController.current?.abort();
  }, []);
  useEffect(() => {
    const onScreenChange = () => {
      if (document.querySelector(".app-shell")?.dataset.activeScreen !== "bible") close();
    };
    window.addEventListener("app:screen-change", onScreenChange);
    return () => window.removeEventListener("app:screen-change", onScreenChange);
  }, []);
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = event => { if (event.key === "Escape") close(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const openReference = reference => {
    setPhase("opening");
    setMessage(`${reference.bookName} ${reference.chapter}:${reference.verse}`);
    void (async () => {
      try {
        await bridge.navigateToReference(reference.bookId, reference.chapter, reference.verse);
        close();
      } catch {
        setPhase("error");
        setMessage(`Je n’ai pas pu ouvrir ${reference.bookName} ${reference.chapter}:${reference.verse}. Vérifiez la référence et réessayez.`);
      }
    })();
  };

  const start = () => {
    setOpen(true);
    setTranscript("");
    setMessage("");
    setPhase("starting");
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setPhase("error");
      setMessage("L’enregistrement audio n’est pas disponible dans ce navigateur.");
      return;
    }
    const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]
      .find(type => window.MediaRecorder.isTypeSupported?.(type));
    let session;
    try {
      session = startBibleVoiceRecorder({
        getStream: () => navigator.mediaDevices.getUserMedia({ audio: true }),
        createRecorder: stream => mimeType ? new window.MediaRecorder(stream, { mimeType }) : new window.MediaRecorder(stream),
        createAudioContext: () => new (window.AudioContext || window.webkitAudioContext)(),
        requestFrame: callback => window.requestAnimationFrame(callback),
        cancelFrame: frame => window.cancelAnimationFrame(frame),
        onLevels: nextLevels => setLevels(nextLevels.map(level => Number.isFinite(level) ? level : 0)),
        onReady: () => { setPhase("listening"); setMessage("Je vous écoute… une pause de 2 secondes lancera la recherche."); },
        onSilence: () => { setPhase("transcribing"); setMessage("Pause détectée. Transcription IA en cours…"); },
        silenceMs: 2000,
        maxDurationMs: 30_000,
      });
      recording.current = session;
    } catch {
      setPhase("error");
      setMessage("Le microphone n’a pas pu démarrer.");
      return;
    }
    void (async () => {
      try {
        const blob = await session.done;
        if (recording.current !== session) return;
        recording.current = null;
        if (!blob?.size) throw new Error("Aucune parole n’a été détectée. Réessayez.");
        setPhase("transcribing");
        setMessage("Transcription par IA en cours…");
        const controller = new AbortController();
        requestController.current = controller;
        const text = await requestBibleVoiceTranscript(blob, { signal: controller.signal });
        if (requestController.current !== controller) return;
        requestController.current = null;
        setTranscript(text);
        const reference = parseBibleReference(text, state.books);
        if (reference) openReference(reference);
        else {
          setPhase("error");
          setMessage("Je n’ai pas trouvé le livre, le chapitre et le verset dans la transcription. Réessayez.");
        }
      } catch (error) {
        if (error.name === "AbortError") return;
        if (recording.current === session) recording.current = null;
        requestController.current = null;
        setPhase("error");
        setMessage(error.name === "NotAllowedError"
          ? "Autorisez le microphone dans les paramètres de l’application. Sur Android, installez la version 1.2 ou ultérieure."
          : error.message || "La transcription IA a échoué. Réessayez.");
      }
    })();
  };

  return <>
    <button type="button" className="icon-button bible-glass-control bible-glass-search bible-voice-button" aria-label="Chercher un verset par la voix" title="Chercher un verset par la voix" onClick={start}>
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8" /></svg>
    </button>
    {open && createPortal(<div className="bible-voice-overlay" role="dialog" aria-modal="true" aria-label="Recherche vocale de verset">
      <button type="button" className="bible-voice-dismiss" aria-label="Fermer" onClick={close} />
      <section className="bible-voice-listening">
        <p className="bible-voice-prompt">Ask me to search a scripture</p>
        <div className={`bible-voice-wave${phase === "listening" ? " is-listening" : phase !== "error" ? " is-processing" : ""}`} aria-hidden="true">
          {levels.map((level, index) => <i key={index} style={{ "--voice-level": `${Math.max(.12, level) * 100}%`, "--voice-delay": `${index * 24}ms` }} />)}
        </div>
        <div className="bible-voice-feedback">
          {transcript && <p className="bible-voice-transcript" aria-live="polite">{transcript}</p>}
          {phase === "error" && <>
            <p className="bible-voice-status" role="alert">{message}</p>
            <button className="bible-voice-retry" type="button" onClick={start}>Réessayer</button>
          </>}
        </div>
      </section>
    </div>, document.body)}
  </>;
}

export function BibleParallelControls() {
  const [state, bridge] = useBibleReaderState();

  return (
    <>
      <button className={`parallel-toggle bible-glass-control bible-glass-parallel${state.parallelEnabled ? " is-active" : ""}`} type="button" onClick={bridge.toggleParallel}>
        <span className="bible-glass-control-content">{columnsIcon}<span>Parallel</span></span>
      </button>
      <button className={`parallel-toggle reader-target-toggle bible-glass-control bible-glass-target${state.showHighlightsOnly ? " is-active" : ""}`} type="button" onClick={bridge.toggleTarget}>
        <span className="bible-glass-control-content">{targetIcon}<span>Highlights</span></span>
      </button>

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

function useVerseSelection(verse, bridge) {
  const longPressTimer = useRef(null);
  const longPressTriggered = useRef(false);
  const pointerStart = useRef(null);
  const clearLongPress = () => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  };
  useEffect(() => clearLongPress, []);
  const startLongPress = (event) => {
    if (event.button !== 0 || event.isPrimary === false) return;
    clearLongPress();
    pointerStart.current = { x: event.clientX, y: event.clientY };
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
  return {
    onClick: handleClick,
    onPointerDown: startLongPress,
    onPointerUp: clearLongPress,
    onPointerCancel: clearLongPress,
    onPointerLeave: clearLongPress,
    onPointerMove(event) {
      const start = pointerStart.current;
      if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) clearLongPress();
    },
  };
}

function BibleVerseLine({ verse, selection, bridge }) {
  const selectionHandlers = useVerseSelection(verse, bridge);
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
      {...selectionHandlers}
    >
      {verse.number ? <sup>{verse.number}</sup> : null}{verse.text}
    </p>
  );
}

function BibleEmptyState({ state }) {
  if (state.status === "loading") return <p className="reader-empty">Loading chapter...</p>;
  if (state.status === "error") return <div className="reader-empty"><strong>Could not load this version.</strong><span>{state.error}</span></div>;
  if (!state.verses.length) {
    if (state.showHighlightsOnly) return <p className="reader-empty reader-empty-highlight">No highlighted verses.</p>;
    return <div className="reader-empty"><strong>{state.title}</strong><span>{state.copyright}</span></div>;
  }
  return <p className="reader-empty reader-empty-highlight">No highlighted verses.</p>;
}

function BibleParallelContent({ state, selection, bridge }) {
  const [controls, readerBridge] = useBibleReaderState();
  return (
    <div className="parallel-scripture-grid">
      <div className="parallel-version-headers" aria-label="Bible versions">
        <label className="parallel-version-header is-primary">
          <span>Current version</span><strong>{state.parallel.primary.label}</strong><small>{state.parallel.primary.name}</small>
          <select aria-label="Choose current Bible version" value={controls.versionId} onChange={(event) => readerBridge.setVersion(event.target.value)}>
            {controls.versionOptions.map((option) => option.separator
              ? <option key="separator" disabled value="">────────────</option>
              : <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
        </label>
        <label className="parallel-version-header is-compare">
          <span>Compared version</span><strong>{state.parallel.compare.label}</strong><small>{state.parallel.compare.name}</small>
          <select aria-label="Choose compared Bible version" value={controls.parallelVersionId} onChange={(event) => readerBridge.setParallelVersion(event.target.value)}>
            {controls.parallelOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
        </label>
      </div>
      {state.parallel.rows.map((verse) => <BibleParallelVerse key={verse.key} verse={verse} state={state} selection={selection} bridge={bridge} />)}
    </div>
  );
}

function BibleParallelVerse({ verse, state, selection, bridge }) {
  const selectionHandlers = useVerseSelection(verse, bridge);
  return (
        <article
          className={`parallel-scripture-line${verse.highlighted ? " is-highlighted" : ""}${verse.bookmarked ? " is-bookmarked" : ""}${verse.noted ? " is-noted" : ""}${selection.selectedKey === verse.key ? " is-selected" : ""}${selection.selectedKeys.includes(verse.key) ? " is-multi-selected" : ""}`}
          style={verse.highlightColor ? { "--highlight-color": verse.highlightColor } : undefined}
          data-verse={verse.reference}
          data-highlight-key={verse.highlightKey}
          data-verse-key={verse.key}
          data-verse-number={verse.number || ""}
          data-verse-version={verse.version}
          data-verse-text={verse.text}
          {...selectionHandlers}
        >
          <p className="parallel-scripture-column" data-parallel-role="primary" aria-label={state.parallel.primary.label}>{verse.number ? <sup>{verse.number}</sup> : null}{verse.text}</p>
          <p className="parallel-scripture-column" data-parallel-role="compare" aria-label={state.parallel.compare.label}>{verse.number ? <sup>{verse.number}</sup> : null}{verse.comparisonText}</p>
        </article>
  );
}

function BibleChapterNavigation({ state, bridge }) {
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const quizContainer = useRef(null);
  useEffect(() => {
    if (quizOpen) quizContainer.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }, [quizOpen]);
  const bookIndex = state.books.findIndex((book) => book.id === state.bookId);
  const atBibleBeginning = bookIndex <= 0 && state.chapter <= 1;
  const atBibleEnd = bookIndex >= state.books.length - 1 && state.chapter >= state.chapterCount;

  const goToChapter = (delta) => {
    bridge.changeChapter(delta);
    document.querySelector(".reader-screen")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <><nav className="bible-chapter-navigation" aria-label="Chapter navigation">
      <button type="button" onClick={() => goToChapter(-1)} disabled={atBibleBeginning} aria-label="Previous chapter">
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
      </button>
      <button className="bible-chapter-quiz-toggle" type="button" onClick={() => { setQuizStarted(true); setQuizOpen(open => !open); }} aria-expanded={quizOpen} aria-controls="bible-chapter-quiz"><span>Quiz</span></button>
      <button type="button" onClick={() => goToChapter(1)} disabled={atBibleEnd} aria-label="Next chapter">
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
      </button>
    </nav>
    <div id="bible-chapter-quiz" ref={quizContainer} hidden={!quizOpen}>
      {quizStarted && <ChapterQuiz source={state.quizSource} bridge={bridge} />}
    </div></>
  );
}

export function BibleChapterContent() {
  const { state, verseState, bridge } = useBibleChapterState();
  if (state.status !== "ready" || !state.verses.length) return <BibleEmptyState state={state} />;
  const content = state.parallelEnabled && state.parallel
    ? <BibleParallelContent state={state} selection={verseState} bridge={bridge} />
    : state.verses.map((verse) => <BibleVerseLine key={verse.key} verse={verse} selection={verseState} bridge={bridge} />);
  return <>{content}<BibleChapterNavigation key={`${state.versionId}:${state.bookId}:${state.chapter}`} state={state} bridge={bridge} /></>;
}
