import React, { useCallback, useEffect, useRef, useState } from "react";
import { validateChapterQuiz } from "../../lib/bible/chapter-quiz.js";

export function ChapterQuiz({ source, bridge }) {
  const [status, setStatus] = useState("loading");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [drafts, setDrafts] = useState({});
  const [finished, setFinished] = useState(false);
  const heading = useRef(null);
  const panel = useRef(null);
  const sourceJson = JSON.stringify(source);

  const revealQuestion = useCallback(() => {
    panel.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    heading.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (status === "ready") revealQuestion();
  }, [status, revealQuestion]);

  useEffect(() => {
    const controller = new AbortController();
    const startedAt = performance.now();
    let readyTimer;
    // Estimated progress stays below completion until validated questions arrive.
    setStatus("loading"); setError(""); setLoadingProgress(0);
    const progressTimer = window.setInterval(() => {
      const elapsed = performance.now() - startedAt;
      setLoadingProgress(Math.min(95, Math.round(95 * (1 - Math.exp(-elapsed / 18_000)))));
    }, 400);
    bridge.createChapterQuiz(JSON.parse(sourceJson), controller.signal).then(payload => {
      if (controller.signal.aborted) return;
      setQuestions(validateChapterQuiz(payload, JSON.parse(sourceJson)));
      window.clearInterval(progressTimer);
      setLoadingProgress(100);
      setStatus("finishing");
      readyTimer = window.setTimeout(() => setStatus("ready"), 250);
    }).catch(error => {
      window.clearInterval(progressTimer);
      if (controller.signal.aborted) return;
      setError(error.message); setStatus("error");
    });
    return () => {
      controller.abort();
      window.clearInterval(progressTimer);
      window.clearTimeout(readyTimer);
    };
  }, [sourceJson, bridge, attempt]);

  const goTo = next => {
    setIndex(next); setFinished(false);
    requestAnimationFrame(revealQuestion);
  };
  const score = questions.reduce((n, q, i) => n + Number(answers[i] === q.correctAnswer), 0);
  const validated = Object.hasOwn(answers, index);
  const question = questions[index];
  const selected = validated ? answers[index] : drafts[index];

  return <section ref={panel} className="chapter-quiz" aria-label={`Quiz — ${source.reference}`} aria-busy={status === "loading" || status === "finishing"}>
    <header className="chapter-quiz-header"><div><span>Chapter quiz</span><h2>{source.reference}</h2></div>{status === "ready" && <span>{Object.keys(answers).length} / 10 checked</span>}</header>
    {(status === "loading" || status === "finishing") && <div className={`chapter-quiz-loading${status === "finishing" ? " is-complete" : ""}`}>
      <div className="chapter-quiz-loading-ring" aria-hidden="true"><span className="chapter-quiz-spinner" /><strong>{loadingProgress}<small>%</small></strong></div>
      <p role="status">{status === "finishing" ? "Your questions are ready!" : "Creating 10 questions…"}</p>
      <div className="chapter-quiz-loading-bar" role="progressbar" aria-label="Preparing questions, estimated progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={loadingProgress} aria-valuetext={`${loadingProgress} %${loadingProgress < 100 ? ", estimated" : ""}`}>
        <span style={{ transform: `scaleX(${loadingProgress / 100})` }} />
      </div>
      <span className="chapter-quiz-loading-note">{status === "finishing" ? "Let’s go!" : "Estimated progress"}</span>
    </div>}
    {status === "error" && <div role="alert"><p>{error}</p><button type="button" onClick={() => setAttempt(n => n + 1)}>Try again</button></div>}
    {status === "ready" && (finished ? <div className="chapter-quiz-result" aria-live="polite">
      <h3 ref={heading} tabIndex={-1}>Quiz complete!</h3><p className="chapter-quiz-score">{score} / 10</p><p>You can review your answers or start again.</p>
      <button type="button" onClick={() => goTo(0)}>Review my answers</button>
      <button type="button" onClick={() => { setAnswers({}); setDrafts({}); goTo(0); }}>Start again</button>
    </div> : <>
      <p className="chapter-quiz-progress">Question {index + 1} / 10</p>
      <h3 ref={heading} tabIndex={-1}>{question.question}</h3>
      <fieldset className="chapter-quiz-options" disabled={validated}>
        <legend className="sr-only">Choose an answer</legend>
        {question.options.map((option, i) => <label key={i} className={`chapter-quiz-option${selected === i ? " is-selected" : ""}${validated && i === question.correctAnswer ? " is-correct" : ""}${validated && selected === i && i !== question.correctAnswer ? " is-incorrect" : ""}`}>
          <input type="radio" name="chapter-quiz-answer" value={i} checked={selected === i} onChange={() => setDrafts(current => ({ ...current, [index]: i }))} />
          <span className="chapter-quiz-letter">{"ABCD"[i]}</span><span>{option}</span>
          {validated && i === question.correctAnswer && <span className="chapter-quiz-answer-label">Correct answer</span>}
          {validated && selected === i && i !== question.correctAnswer && <span className="chapter-quiz-answer-label">Your answer</span>}
        </label>)}
      </fieldset>
      {validated ? <div className="chapter-quiz-feedback" role="status">
        <strong>{selected === question.correctAnswer ? "Correct answer!" : "That’s not the right answer."}</strong>
        <p>{question.explanation}</p><blockquote>« {question.quote} »</blockquote><small>{source.reference}:{question.verse}</small>
      </div> : <button className="chapter-quiz-validate" type="button" disabled={selected === undefined} onClick={() => setAnswers(current => ({ ...current, [index]: selected }))}>Check my answer</button>}
      <nav className="chapter-quiz-navigation" aria-label="Quiz navigation">
        <button type="button" onClick={() => goTo(index - 1)} disabled={index === 0} aria-label="Previous question">←</button>
        <span>{index + 1} / 10</span>
        <button type="button" disabled={!validated} onClick={() => { if (index < 9) goTo(index + 1); else { setFinished(true); requestAnimationFrame(revealQuestion); } }} aria-label={index === 9 ? "See my result" : "Next question"}>{index === 9 ? "Finish" : "→"}</button>
      </nav>
    </>)}
  </section>;
}
