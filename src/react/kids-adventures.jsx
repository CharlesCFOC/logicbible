import React, { useEffect, useRef, useState } from "react";
import { kidsAdventures, kidsBooks, newAdventureProgress, readAdventureProgress, saveAdventureProgress } from "./kids-adventures-data.js";

const Emoji = ({ children }) => <span aria-hidden="true">{children}</span>;

function KidsAdventure({ adventure, onBack, onEarn }) {
  const [progress, setProgress] = useState(() => {
    const saved = readAdventureProgress(adventure.id);
    return saved.stage === 5 ? { ...newAdventureProgress(), completed: saved.completed } : saved;
  });
  const [selected, setSelected] = useState(null);
  const [orderFeedback, setOrderFeedback] = useState("");
  const heading = useRef(null);
  const { stage, scene, question, answers, order, ordered } = progress;
  const currentQuestion = adventure.questions[question];
  const answered = Object.hasOwn(answers, question);
  const isCorrect = answered && answers[question] === currentQuestion.correct;
  const correctCount = adventure.questions.filter((q, i) => Object.hasOwn(answers, i) && answers[i] === q.correct).length;

  useEffect(() => { saveAdventureProgress(adventure.id, progress); }, [adventure.id, progress]);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    document.getElementById("kids-bible")?.scrollTo({ top: 0, behavior: "auto" });
  }, [stage, scene, question]);
  const change = patch => { setSelected(null); setProgress(p => ({ ...p, ...patch })); };
  const stages = ["Discover", "Read", "Play", "Put in order", "Take action", "Well done!"];

  return <section className={`kids-adventure kids-adventure--${adventure.color}`} aria-label={adventure.title}>
    <div className="kids-adventure-top"><button type="button" onClick={onBack} aria-label="Back to adventures">←</button><span>{adventure.reference}</span><span>{stage + 1} / 6</span></div>
    <div className="kids-adventure-track" aria-label={`Step ${stage + 1} of 6: ${stages[stage]}`}>{stages.map((label, i) => <span key={label} className={i <= stage ? "is-reached" : ""} />)}</div>
    <p className="kids-adventure-eyebrow">{stages[stage]}</p>
    <h2 ref={heading} tabIndex={-1}>{stage === 1 ? adventure.scenes[scene].title : stage === 2 ? "Your turn!" : stage === 3 ? "What happened first?" : stage === 4 ? "An idea for today" : stage === 5 ? "Adventure complete!" : adventure.title}</h2>

    {stage === 0 && <>
      <img className="kids-adventure-illustration" src={adventure.image} alt={`Illustration of ${adventure.title}`} style={{ objectPosition: `50% ${adventure.coverPosition}` }} />
      <div className="kids-adventure-reading"><p>{adventure.intro}</p><div className="kids-adventure-meta"><span>⏱ About {adventure.minutes} min</span><span>3 scenes · 3 questions</span></div></div>
      <button className="kids-adventure-primary" type="button" onClick={() => change({ stage: 1 })}>Let’s go! <span aria-hidden="true">→</span></button>
    </>}

    {stage === 1 && <>
      <img className="kids-adventure-illustration" src={adventure.image} alt={`Illustration of ${adventure.title}`} style={{ objectPosition: `50% ${adventure.scenes[scene].position}` }} />
      <div className="kids-adventure-reading"><span className="kids-adventure-scene-count">Scene {scene + 1} / 3</span><p>{adventure.scenes[scene].text}</p></div>
      <nav className="kids-adventure-controls" aria-label="Story navigation"><button type="button" onClick={() => scene ? change({ scene: scene - 1 }) : change({ stage: 0 })}>← Back</button><button className="kids-adventure-primary" type="button" onClick={() => scene < 2 ? change({ scene: scene + 1 }) : change({ stage: 2 })}>{scene < 2 ? "Next →" : "Your turn →"}</button></nav>
    </>}

    {stage === 2 && <>
      <p className="kids-adventure-scene-count">Question {question + 1} / 3</p><h3>{currentQuestion.question}</h3>
      <fieldset className="kids-adventure-choices" disabled={answered}><legend className="sr-only">Choose your answer</legend>{currentQuestion.choices.map(([emoji, text], i) => <label key={text} className={`${(answered ? answers[question] : selected) === i ? "is-selected" : ""} ${answered && i === currentQuestion.correct ? "is-correct" : ""} ${answered && answers[question] === i && !isCorrect ? "is-incorrect" : ""}`}>
        <input type="radio" name="kids-adventure-answer" checked={(answered ? answers[question] : selected) === i} onChange={() => setSelected(i)} /><Emoji>{emoji}</Emoji><span>{text}{answered && i === currentQuestion.correct && <small>✓ Correct answer</small>}{answered && answers[question] === i && !isCorrect && <small>✗ Your answer is incorrect</small>}</span>
      </label>)}</fieldset>
      {answered ? <div className={`kids-adventure-feedback ${isCorrect ? "is-correct" : "is-incorrect"}`} role="status"><strong>{isCorrect ? "✓ Well done, that’s correct!" : "✗ That’s not the right answer. Let’s learn together!"}</strong><p>{currentQuestion.explanation}</p></div> : <button className="kids-adventure-primary" type="button" disabled={selected === null} onClick={() => change({ answers: { ...answers, [question]: selected } })}>Check my answer</button>}
      <p className="kids-adventure-score">Correct answers: {correctCount} / {adventure.questions.length}</p>
      <nav className="kids-adventure-controls" aria-label="Question navigation"><button type="button" onClick={() => question ? change({ question: question - 1 }) : change({ stage: 1, scene: 2 })}>← Back</button><button className="kids-adventure-primary" type="button" disabled={!answered} onClick={() => question < 2 ? change({ question: question + 1 }) : change({ stage: 3 })}>{question < 2 ? "Next question →" : "Play the game →"}</button></nav>
    </>}

    {stage === 3 && <>
      <p>Tap the three cards in the order they happened in the story.</p><div className="kids-adventure-order-slots" aria-label="Your order">{[0, 1, 2].map(i => <span key={i}>{order[i] === undefined ? i + 1 : <Emoji>{adventure.order[order[i]][0]}</Emoji>}</span>)}</div>
      <div className="kids-adventure-order-cards">{[2, 0, 1].map(id => <button key={id} type="button" disabled={ordered || order.includes(id)} onClick={() => { setOrderFeedback(""); change({ order: [...order, id] }); }}><Emoji>{adventure.order[id][0]}</Emoji><span>{adventure.order[id][1]}</span>{order.includes(id) && <b>{order.indexOf(id) + 1}</b>}</button>)}</div>
      {orderFeedback && <p className="kids-adventure-feedback" role="status">{orderFeedback}</p>}
      <div className="kids-adventure-controls"><button type="button" disabled={ordered || !order.length} onClick={() => { setOrderFeedback(""); change({ order: [] }); }}>Reset the order</button>{ordered ? <button className="kids-adventure-primary" type="button" onClick={() => change({ stage: 4 })}>My little challenge →</button> : <button className="kids-adventure-primary" type="button" disabled={order.length !== 3} onClick={() => { if (order.every((id, i) => id === i)) { change({ ordered: true }); setOrderFeedback("Well done! You put the story in the right order!"); } else setOrderFeedback("Try again. Think about the beginning, then what happens next."); }}>Check the order</button>}</div>
    </>}

    {stage === 4 && <>
      <div className="kids-adventure-takeaway"><Emoji>{adventure.icon}</Emoji><span>What I learned</span><p>{adventure.takeaway}</p></div>
      <div className="kids-adventure-reading"><h3>My little challenge</h3><p>{adventure.mission}</p><h3>A short prayer</h3><p>{adventure.prayer}</p></div>
      <button className="kids-adventure-primary" type="button" onClick={() => { change({ stage: 5, completed: true }); onEarn(adventure.id); }}>I’ll try this challenge today ✨</button>
    </>}

    {stage === 5 && <div className="kids-adventure-finish"><div className="kids-adventure-badge"><Emoji>{adventure.icon}</Emoji></div><p className="kids-adventure-eyebrow">My new discovery</p><h3>{adventure.badge}</h3><p>You explored the story, answered the questions, and put the scenes in order. Well done!</p><p className="kids-adventure-score">Correct answers: {correctCount} / {adventure.questions.length}</p><p className="kids-adventure-completion">An adventure in your collection</p><button className="kids-adventure-primary" type="button" onClick={onBack}>Choose another adventure →</button><button type="button" onClick={() => { setOrderFeedback(""); setSelected(null); setProgress({ ...newAdventureProgress(), completed: progress.completed }); }}>Read and play again</button></div>}
  </section>;
}

export function KidsAdventureHub({ bookId, onBookChange, earnedIds, onEarn }) {
  const [selectedId, setSelectedId] = useState(null);
  const [revision, setRevision] = useState(0);
  let last;
  try { last = localStorage.getItem("brother.kidsAdventure.last"); } catch { /* Optional resume. */ }
  const resume = kidsAdventures.find(a => a.id === last && readAdventureProgress(a.id).stage > 0 && readAdventureProgress(a.id).stage < 5);

  const selected = kidsAdventures.find(a => a.id === selectedId);
  const book = kidsBooks.find(b => b.id === bookId);
  const adventures = kidsAdventures.filter(a => a.bookId === bookId);
  const open = id => { onBookChange(kidsAdventures.find(a => a.id === id)?.bookId || null); setSelectedId(id); };
  if (selected) return <KidsAdventure key={selected.id} adventure={selected} onEarn={onEarn} onBack={() => { setSelectedId(null); setRevision(n => n + 1); }} />;
  return <div className="kids-adventure-hub" data-revision={revision}>
      {book && <button className="kids-adventure-books-back" type="button" onClick={() => onBookChange(null)}>← All books</button>}
      {!book && <div className="kids-adventure-welcome is-notebook"><span className="kids-adventure-eyebrow">My adventure notebook</span><h2>Your next<br />great journey</h2><p>Choose a book. An amazing discovery awaits!</p><div className="kids-notebook-stamps" aria-hidden="true"><span>🌍</span><span>🌈</span><span>⛵</span><span>🌾</span></div></div>}
      {resume && <button className="kids-adventure-resume" type="button" onClick={() => open(resume.id)}><Emoji>{resume.icon}</Emoji><span><small>Continue your adventure</small><strong>{resume.title}</strong></span><span aria-hidden="true">→</span></button>}
      {!book ? <div className="kids-adventure-book-grid">{kidsBooks.map(b => {
        const stories = kidsAdventures.filter(a => a.bookId === b.id);
        const earned = stories.filter(a => earnedIds.includes(a.id)).length;
        return <button className={`kids-adventure-book kids-adventure-book--${b.id}`} type="button" key={b.id} onClick={() => onBookChange(b.id)}>
          <div className="kids-adventure-book-art"><img src={stories[0].image} alt="" loading="lazy" /><span className="kids-book-art-icon" aria-hidden="true">{b.icon}</span><span className="kids-book-art-count">{stories.length} adventures</span></div>
          <div className="kids-adventure-book-info"><strong>{b.title}</strong><p>{b.subtitle}</p><div className="kids-book-discoveries" aria-label={`${earned} adventures discovered out of ${stories.length}`}>{stories.map(a => <span key={a.id} className={earnedIds.includes(a.id) ? "is-earned" : ""} aria-hidden="true">{earnedIds.includes(a.id) ? "✓" : "✦"}</span>)}<small>{earned} / {stories.length} discoveries</small></div><span className="kids-book-open">Explore this book <span aria-hidden="true">→</span></span></div>
        </button>;
      })}</div> : <><div className="kids-adventure-path-summary"><span>{adventures.filter(a => earnedIds.includes(a.id)).length} / {adventures.length} discoveries</span><small>Go at your own pace. Choose a story.</small></div><ol className="kids-adventure-card-grid kids-adventure-path">{adventures.map((a, index) => {
        const p = readAdventureProgress(a.id);
        const inProgress = p.stage > 0 && p.stage < 5;
        return <li className="kids-adventure-path-stop" key={a.id}><span className={`kids-adventure-path-number ${earnedIds.includes(a.id) ? "is-earned" : ""}`} aria-label={`Step ${index + 1}`}>{index + 1}</span><button className={`kids-adventure-card kids-adventure--${a.color}`} type="button" onClick={() => open(a.id)}>
          <div className="kids-adventure-cover"><img src={a.image} alt="" loading="lazy" style={{ objectPosition: `50% ${a.coverPosition}` }} /><span>{a.icon}</span><span className={`kids-adventure-state ${inProgress ? "is-current" : earnedIds.includes(a.id) ? "is-earned" : ""}`}>{inProgress ? "In progress" : earnedIds.includes(a.id) ? "✓ Completed" : "To discover"}</span></div><div className="kids-adventure-card-copy"><small>{a.theme}</small><h3>{a.title}</h3><p>{a.subtitle}</p><span className="kids-adventure-card-meta">{a.minutes} min · 3 scenes · Mini-games</span><strong className="kids-adventure-card-action">{inProgress ? "Continue the adventure →" : earnedIds.includes(a.id) ? "Replay the adventure →" : "Let’s go →"}</strong></div>
        </button></li>;
      })}</ol></>}

  </div>;
}
