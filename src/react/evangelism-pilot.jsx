import React, { createContext, useContext, useEffect, useId, useMemo, useReducer, useRef, useState } from "react";
import { evangelismPilot, createPilotEngine, pilotSourceQuestion, pilotRidge } from "../shared/evangelism-pilot.js";
import { pilotDialogueSegments, groupPilotConversation } from "../shared/pilot-dialogue.js";
import { pilotMountainBranches, pilotMountainCurve } from "../shared/pilot-mountain.js";
import { churchValues, churchDifficultyLabels } from "../shared/church-scenario.js";
import { journeyRevealFrame, normalizeJourneyReveal, pilotSessionReducer } from '../shared/pilot-journey-reveal.js';
import { ReadAloudButton, stopReadAloud } from './read-aloud.jsx';

export const storagePrefix = "brother.evangelismPilot.v1.";
const PilotContext = createContext(createPilotEngine());
const usePilot = () => useContext(PilotContext);
const qualityLabels = { solid: "Strong response", mixed: "Partial response", risky: "Problematic response" };
const sessionLifetime = 8 * 60 * 60 * 1000;

function useMobileDiscussion(readOnly) {
  const [mobile, setMobile] = useState(() => !readOnly && window.matchMedia('(max-width: 900px)').matches);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 900px)');
    const update = () => setMobile(!readOnly && query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [readOnly]);
  return mobile;
}

function readPilot(key, engine) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "null");
    if (!saved || Date.now() - saved.updatedAt >= sessionLifetime) return null;
    const normalized = engine.normalizePilotState(saved.state);
    const journeyReveal = normalizeJourneyReveal(saved.state?.journeyReveal, normalized);
    return journeyReveal ? { ...normalized, journeyReveal } : normalized;
  } catch { return null; }
}

export function getSessionId() {
  const params = new URLSearchParams(window.location.search);
  const existing = params.get("session");
  if (/^[a-f0-9-]{36}$/i.test(existing || "")) return existing;
  if (params.get("screen") === "1") return "";
  const id = crypto.randomUUID();
  params.set("session", id);
  window.history.replaceState(null, "", `${window.location.pathname}?${params}`);
  return id;
}

function trailCurve(from, to) {
  const dx = (to[0] - from[0]) * .4;
  return `M${from} C${from[0] + dx},${from[1]} ${to[0] - dx},${to[1]} ${to}`;
}

function RefugeMarker({ refuge, point, reached, active }) {
  return <g className={`pilot-refuge${reached ? " is-reached" : ""}${active ? " is-active" : ""}`} transform={`translate(${point})`}>
    <title>{`Shelter ${refuge.id} · ${reached ? "objective completed" : active ? "objective in progress" : "ahead"}`}</title>
    <path className="pilot-refuge-wall" d="M-21 0v-23L0-41l21 18V0Z" />
    <path className="pilot-refuge-door" d="M-5 0v-14H5V0" />
    <text className="pilot-refuge-label" y="29" textAnchor="middle">{refuge.id}</text>
  </g>;
}

function MountainIllustration({ state, detailed = false, seed, revealLast = false }) {
  const engine = usePilot();
  const { scenario, pilotTrail, pilotRefuges } = engine;
  const id = useId().replace(/:/g, "");
  const trail = pilotTrail(state);
  const refuges = pilotRefuges(state);
  const branches = detailed ? engine.shared ? engine.mountainBranches : pilotMountainBranches(state, seed, engine) : { nodes: [], edges: [] };
  const ridgePath = pilotRidge.slice(1).map((to, index) => trailCurve(pilotRidge[index], to).replace(/^M[^C]+/, index ? "" : `M${pilotRidge[0]} `)).join(" ");
  return (
    <svg className={`pilot-map-svg pilot-map-svg--landscape${ detailed ? " pilot-map-svg--detailed" : ""}`} viewBox="0 0 1000 520" role="img" aria-label={`Panoramic mountain${detailed ? ", with connected paths to the summit" : ""}. ${trail.belowRidge ? "The path is below the ridge." : "The path follows the ridge."}`}>
      <defs>
        <linearGradient id={`${id}-accent`} gradientUnits="userSpaceOnUse" x1="90" y1="365" x2="900" y2="65"><stop stopColor="#b267ff" /><stop offset="1" stopColor="#ed86e4" /></linearGradient>
        <linearGradient id={`${id}-rock`} x2=".8" y2="1"><stop stopColor="#5f8bb1" /><stop offset="1" stopColor="#28456e" /></linearGradient>
        <linearGradient id={`${id}-front`} x2=".1" y2="1"><stop stopColor="#3d628d" /><stop offset="1" stopColor="#142c50" /></linearGradient>
        <filter id={`${id}-glow`}><feGaussianBlur stdDeviation="6" /></filter>
      </defs>
      <circle cx="935" cy="80" r="44" fill="#bb66ff" opacity=".25" />
      <path d="M0 392 110 310 205 350 360 195 475 270 650 112 740 175 855 65 1000 205V520H0Z" fill="#253e66" />
      <path d={`${ridgePath} L1000 190V520H0V430Z`} fill={`url(#${id}-rock)`} />
      <path d="m470 225 52 154 143-229-40 216 235-291-60 315 200-200v330H0V430l90-65 96 90 89-155 68 143Z" fill={`url(#${id}-front)`} opacity=".8" />
      <path d="m860 75-88 54 27 6 16 28 22-29 20 11 25-7 17 13 31-4Z" fill="#e6effb" />
      <path d="M0 505 180 424 340 482 510 380 690 430 840 310 1000 382V520H0Z" fill="#1c3659" opacity=".6" />
      <g fill="none" stroke="#c7dcf6" strokeWidth="1.2" opacity=".14"><path d="m110 395 145-45 95 60 155-95 146 42 157-125" /><path d="m325 300 89-15 74 12 142-94 121-18" /></g>
      <path d={ridgePath} fill="none" stroke="#c5d5e9" strokeWidth="3" strokeDasharray="7 10" opacity=".7" />
      {!detailed && pilotRidge.slice(0, -1).map((from, index) => <path key={index} d={trailCurve(from, [from[0] + 95, Math.min(470, from[1] + 74)])} fill="none" stroke="#b3cae5" strokeWidth="2" strokeDasharray="4 10" opacity=".28" />)}
      {detailed && <g className="pilot-possible-paths" aria-hidden="true">
        {branches.edges.map(edge => <path key={edge.id} d={pilotMountainCurve(edge)} className={`pilot-possible-edge pilot-possible-edge--${edge.depth}`} />)}
        {branches.nodes.filter(node => node.kind === "possible").map(node => <circle key={node.id} cx={node.point[0]} cy={node.point[1]} r={node.depth === 1 ? 8 : 6} className={`pilot-possible-node pilot-possible-node--${node.depth}`} />)}
      </g>}
      {trail.segments.map((segment, index) => <g key={segment.id}><path className={`pilot-trail-segment pilot-trail-segment--${segment.direction}${revealLast && index === trail.segments.length - 1 ? " pilot-journey-new-segment" : ""}`} pathLength={revealLast && index === trail.segments.length - 1 ? 1 : undefined} d={trailCurve(segment.from, segment.to)} fill="none" stroke={segment.direction === "down" ? "#e5a1f5" : `url(#${id}-accent)`} strokeWidth={revealLast && index === trail.segments.length - 1 ? 9 : 6} strokeLinecap="round" /><circle cx={segment.to[0]} cy={segment.to[1]} r="5" fill={segment.direction === "down" ? "#e5a1f5" : "#cf91ff"} /></g>)}
      {scenario.refuges.map(refuge => <RefugeMarker key={refuge.id} refuge={refuge} point={pilotRidge[refuge.id]} reached={refuges.completed.includes(refuge.id)} active={!refuges.finished && refuges.active.id === refuge.id} />)}
      <path d="M900 65V20l28 9-28 12" fill={`url(#${id}-accent)`} stroke="#7833c6" strokeWidth="2" strokeLinejoin="round" />
      <text x="852" y="15" textAnchor="middle" className="pilot-summit-label">THE SUMMIT</text>
      <g className="pilot-position" style={{ transform: `translate(${trail.current[0]}px, ${trail.current[1]}px)` }}><circle r="26" fill="#c4b5fd" opacity=".35" filter={`url(#${id}-glow)`} /><circle r="15" fill="#f5f3ff" stroke="#7c3aed" strokeWidth="4" /><circle r="6" fill="#5b21b6" /></g>
      <path d="m70 383 20-28 20 28Z" fill="#8b5cf6" stroke="#ede9fe" strokeWidth="1.8" /><path d="m90 355v28m-8 0 8-14 8 14" fill="none" stroke="#4c1d95" strokeWidth="1.5" />
      <text x="90" y="414" textAnchor="middle" className="pilot-camp-label">START</text>
    </svg>
  );
}

function JourneyReveal({ state, readOnly, onDismiss }) {
  const engine = usePilot();
  const [now, setNow] = useState(Date.now);
  const dialog = useRef(null);
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;
  const headingId = useId();
  const frame = journeyRevealFrame(state, now);
  const visible = !!frame;
  const stamp = state.journeyReveal?.startedAt;
  useEffect(() => {
    const update = () => {
      const timestamp = Date.now();
      setNow(timestamp);
      if (journeyRevealFrame(state, timestamp)) return true;
      if (!readOnly && state.journeyReveal) dismiss.current();
      return false;
    };
    if (!update()) return undefined;
    const timer = window.setInterval(() => {
      if (!update()) window.clearInterval(timer);
    }, 100);
    return () => window.clearInterval(timer);
  }, [stamp, state.phase, state.nodeId, state.history.length, readOnly]);
  useEffect(() => {
    if (!visible) return undefined;
    const element = dialog.current;
    element.showModal();
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      element.close();
      document.documentElement.style.overflow = previousOverflow;
      if (!readOnly) document.querySelector('[aria-label="Continue the conversation"], [aria-label="Reach the summit"]')?.focus({ preventScroll: true });
    };
  }, [visible, readOnly]);
  if (!frame) return null;
  const before = engine.pilotReducer(state, { type: 'undo' });
  const mapState = frame.revealed ? state : { ...before, mountainExpanded: false };
  const trail = engine.pilotTrail(state);
  const direction = trail.segments.at(-1)?.direction;
  const label = trail.atSummit ? 'Your team reaches the summit!' : direction === 'up' ? 'Your team is climbing' : direction === 'down' ? 'Your team is descending' : 'Your team moves along the mountain';
  return <dialog ref={dialog} className={`pilot-journey-dialog${frame.revealed ? ' is-revealed' : ''}`} aria-labelledby={headingId} onCancel={event => { event.preventDefault(); if (!readOnly) onDismiss(); }}>
    <div className="pilot-journey-content">
      <header><div><span className="pilot-eyebrow">THE JOURNEY OF YOUR TEAM</span><h2 id={headingId}>Your next step</h2></div>{!readOnly && <button type="button" aria-label="Close journey animation" onClick={onDismiss}>×</button>}</header>
      <div className="pilot-journey-map"><MountainIllustration state={mapState} revealLast={frame.revealed} />
        {!frame.revealed && <div className="pilot-journey-countdown" role="status" aria-live="polite"><strong key={frame.countdown}>{frame.countdown}</strong><span>The path reveals in…</span></div>}
      </div>
      <footer><div role="status" aria-live="polite">{frame.revealed ? <><span className={`pilot-journey-direction pilot-journey-direction--${direction}`} aria-hidden="true">{direction === 'down' ? '↘' : direction === 'up' ? '↗' : '→'}</span><strong>{label}</strong></> : <span>Response confirmed · discovering your route</span>}</div>{frame.revealed && !readOnly && <button type="button" onClick={onDismiss}>Back to discussion</button>}</footer>
    </div>
  </dialog>;
}

function MountainDetail({ state, onClose, readOnly }) {
  const { scenario } = usePilot();
  const dialog = useRef(null);
  const [zoom, setZoom] = useState(.75);
  const titleId = useId();
  const descriptionId = useId();
  const open = state.mountainExpanded;
  const seed = new URLSearchParams(window.location.search).get("session") || scenario.id;
  useEffect(() => {
    const element = dialog.current;
    if (open && !element.open) { setZoom(.75); element.showModal(); }
    if (!open && element.open) element.close();
    if (!open) return undefined;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = previous; };
  }, [open]);
  return <dialog ref={dialog} className="pilot-mountain-dialog" aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={event => { event.preventDefault(); if (!readOnly) onClose(); }} onClick={event => { if (event.target === event.currentTarget && !readOnly) onClose(); }} onKeyDown={event => event.stopPropagation()} onTouchStart={event => event.stopPropagation()} onTouchEnd={event => event.stopPropagation()}>
    {open && <div className="pilot-mountain-detail">
      <header><div><h2 id={titleId}>Paths to the summit</h2><p id={descriptionId}>Four shelters, four objectives. Detours unfold as the conversation progresses.</p></div>{!readOnly && <button type="button" onClick={onClose} autoFocus aria-label="Close the expanded mountain">Close <span aria-hidden="true">×</span></button>}</header>
      <div className="pilot-detail-zoom" role="group" aria-label="Mountain zoom"><button type="button" aria-label="Zoom out" disabled={zoom === .5} onClick={() => setZoom(value => Math.max(.5, value - .25))}>−</button><output aria-live="polite">{Math.round(zoom * 100)} %</output><button type="button" aria-label="Zoom in" disabled={zoom === 2} onClick={() => setZoom(value => Math.min(2, value + .25))}>+</button></div>
      <div className="pilot-detail-viewport" tabIndex={0} aria-label="Expanded map, horizontal and vertical scrolling available when zoomed"><div className="pilot-detail-canvas" style={{ width: `${zoom * 100}%` }}><MountainIllustration state={state} detailed seed={seed} /></div></div>
      <footer><div><i className="pilot-detail-key--taken" />Your journey</div><div><i className="pilot-detail-key--possible" />Possible paths</div><div><i className="pilot-detail-key--position" />You are here</div></footer>
    </div>}
  </dialog>;
}

function MountainMap({ state, onExpand, readOnly }) {
  const { pilotEmotionalState, pilotRefuges } = usePilot();
  const mood = pilotEmotionalState(state);
  const refuges = pilotRefuges(state);
  return <aside className="pilot-mountain" aria-label="Map of the journey to the summit">
    <div className="pilot-map-heading"><span>{refuges.finished ? "ALL FOUR SHELTERS REACHED" : `SHELTER ${refuges.active.id} / 4`}</span>{!readOnly && <button className="pilot-map-expand" type="button" onClick={() => onExpand(true)} aria-haspopup="dialog">View <span aria-hidden="true">⤢</span></button>}</div>
    <div className="pilot-map-title"><h2>{refuges.finished ? "At the summit" : "Your journey"}</h2></div>
    <MountainIllustration state={state} />
    <div className="pilot-map-legend"><i /><span>Your journey</span><b /><span>The ridge</span><i className="pilot-descent-key" /><span>Descent</span></div>
    {state.phase === "decision" && <p className="pilot-map-pending">{state.selected ? `Response ${state.selected} selected · takes effect after confirmation` : "A · B · C · D — the path appears after your response"}</p>}
    <dl className="pilot-relational-indicators pilot-relational-indicators--map"><div><dt>Attitude</dt><dd>{mood.attitude}</dd></div><div><dt>Frustration</dt><dd>{mood.frustrationLabel}</dd></div><div><dt>Trust</dt><dd>{mood.trustLabel}</dd></div></dl>
    <MountainDetail state={state} onClose={() => onExpand(false)} readOnly={readOnly} />
  </aside>;
}

function MoodPortrait({ mood }) {
  const { scenario } = usePilot();
  const tense = mood.expression === "tense";
  const hurt = ["hurt", "worried"].includes(mood.expression);
  const open = mood.expression === "open";
  const mouth = open ? "M42 68 Q52 77 63 67" : hurt ? "M43 73 Q52 66 62 73" : tense ? "M42 72 L63 71" : "M43 70 Q52 73 62 69";
  return <svg className={`pilot-mood-portrait pilot-mood-portrait--${mood.expression}`} viewBox="0 0 108 112" role="img" aria-label={`${scenario.character.name} : ${mood.feeling}`}>
    <circle cx="54" cy="54" r="49" className="pilot-mood-halo" />
    <path d="M12 112v-9c0-21 18-31 42-31s42 10 42 31v9" fill="#52789d" />
    <path d="m37 81 17 14 17-14-7-7H44Z" fill="#e2b391" />
    <path d="M27 41c0-24 12-35 28-35 19 0 29 14 27 36l-5 21H32Z" fill="#26384b" />
    <ellipse cx="54" cy="50" rx="26" ry="32" fill="#edc6a4" />
    <path d="M28 44c-4-27 14-38 28-38 20 0 28 13 27 34-12-3-18-13-21-20-6 13-18 19-34 24" fill="#26384b" />
    <path d={tense ? "M35 43 46 47M61 47 73 42" : hurt ? "M34 45 46 41M61 41 73 45" : open ? "M35 42Q40 38 46 41M61 41Q67 37 73 41" : "M35 43Q40 40 46 43M61 43Q67 40 73 42"} fill="none" stroke="#35424e" strokeWidth="2.6" strokeLinecap="round" />
    <ellipse cx="41" cy="51" rx="2.2" ry={open ? 3 : 2.5} fill="#253649" /><ellipse cx="67" cy="51" rx="2.2" ry={open ? 3 : 2.5} fill="#253649" />
    <path d="m54 53-3 9 6 1" fill="none" stroke="#bf8b70" strokeWidth="1.4" strokeLinecap="round" />
    <path d={mouth} fill="none" stroke="#945f55" strokeWidth="2.4" strokeLinecap="round" />
    <path d="m37 83 17 12-8 17H28Zm34 0L54 95l8 17h18Z" fill="#365a7e" />
  </svg>;
}

function MarcWords({ text }) {
  return pilotDialogueSegments(text).map((part, index) => part.emphasis ? <strong className="pilot-dialogue-emphasis" key={index}>{part.text}</strong> : part.text);
}

function ConversationPanel({ state }) {
  const { scenario, pilotEmotionalState, pilotTranscript } = usePilot();
  const mood = pilotEmotionalState(state);
  const transcript = pilotTranscript(state);
  const thread = useRef(null);
  useEffect(() => {
    if (state.sideSlide === "conversation" && thread.current) thread.current.scrollTop = thread.current.scrollHeight;
  }, [state.history, state.phase, state.nodeId, state.sideSlide]);
  return <section className="pilot-person-panel" aria-label={`${scenario.character.name} · Conversation and attitude`}>
    <header className="pilot-person-heading"><MoodPortrait mood={mood} /><div><span>{scenario.character.name.toUpperCase()}</span><h2>{mood.feeling}</h2></div></header>
    <ol className="pilot-person-thread" ref={thread} aria-label="Conversation history" tabIndex={0}>{transcript.map(message => <li key={message.id} className={`pilot-person-message${message.role === 'us' ? ' is-ours' : message.role === 'narrator' ? ' is-narration' : ''}`} aria-label={message.role === 'us' ? 'Us' : message.role === 'narrator' ? 'Narration' : scenario.character.name}>{message.role === 'narrator' && <span className="pilot-narration-label">Narration</span>}<p>{message.role === 'marc' ? <MarcWords text={message.text} /> : message.text}</p></li>)}</ol>
  </section>;
}

function ScenarioSideCarousel({ state, onSlide, onMapExpand, readOnly, controls, mobile = false, hidden = false, panelId, labelledBy }) {
  const { scenario } = usePilot();
  const active = !mobile && state.sideSlide === "conversation" ? "conversation" : "mountain";
  const index = active === "mountain" ? 0 : 1;
  const id = useId().replace(/:/g, "");
  const touch = useRef(null);
  const navigate = slide => { if (!readOnly && !mobile) onSlide?.(slide); };
  const next = () => navigate(index ? "mountain" : "conversation");
  const tabKey = event => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key) || readOnly) return;
    event.preventDefault(); event.stopPropagation();
    const target = event.key === "Home" ? "mountain" : event.key === "End" ? "conversation" : index ? "mountain" : "conversation";
    navigate(target);
    event.currentTarget.parentElement.querySelector(`[data-slide="${target}"]`)?.focus();
  };
  return <aside id={panelId} hidden={hidden} className={`pilot-side-panel ${mobile ? 'pilot-mobile-journey' : 'pilot-phone'}`} role={mobile ? 'tabpanel' : 'region'} aria-labelledby={labelledBy} aria-roledescription={mobile ? undefined : 'carousel'} aria-label={mobile ? undefined : 'Journey and conversation'} onTouchStart={event => { touch.current = [event.touches[0].clientX, event.touches[0].clientY]; }} onTouchEnd={event => {
    if (!touch.current) return;
    const [x, y] = touch.current; touch.current = null;
    const end = event.changedTouches[0];
    if (Math.abs(end.clientX - x) > 50 && Math.abs(end.clientX - x) > Math.abs(end.clientY - y)) next();
  }}>
    {!mobile && <div className="pilot-side-tabs" role="tablist" aria-label="Right panel view">{[["mountain", "The journey"], ["conversation", `${scenario.character.name} · Conversation`]].map(([slide, label]) => <button key={slide} id={`${id}-${slide}-tab`} data-slide={slide} type="button" role="tab" aria-selected={active === slide} aria-controls={`${id}-${slide}`} tabIndex={active === slide ? 0 : -1} disabled={readOnly} onKeyDown={tabKey} onClick={() => navigate(slide)}>{label}</button>)}</div>}
    <div className="pilot-side-slide" id={`${id}-mountain`} role={mobile ? undefined : 'tabpanel'} aria-labelledby={mobile ? undefined : `${id}-mountain-tab`} hidden={active !== "mountain"}><MountainMap state={state} onExpand={onMapExpand} readOnly={readOnly} /></div>
    {!mobile && <div className="pilot-side-slide" id={`${id}-conversation`} role="tabpanel" aria-labelledby={`${id}-conversation-tab`} hidden={active !== "conversation"}><ConversationPanel state={state} /></div>}
    {controls && <footer className="pilot-phone-controls" aria-label="Game controls">{controls}</footer>}
  </aside>;
}

function PresenterIcon({ name }) {
  const paths = {
    undo: "M19 12H5m6-6-6 6 6 6",
    restart: "M20 12a8 8 0 1 1-2.34-5.66L20 9M20 4v5h-5",
    play: "m9 5 10 7-10 7Z",
    check: "m5 12 4 4L19 6",
    next: "M5 12h14m-6-6 6 6-6 6",
    chat: "M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6 4V6a2 2 0 0 1 2-2Z M7 9h10M7 13h7",
    flag: "M5 21V3l14 4-14 5",
    mountain: 'M3 20 9 7l4 7 3-5 5 11ZM7 11l2 2 2-2',
  };
  return <svg className={`pilot-control-icon pilot-control-icon--${name}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}

function Speaker({ who, ours = false, children, reaction = false, question = false, animate = true }) {
  const { scenario } = usePilot();
  const name = who || scenario.character.name;
  return <article className={`pilot-dialogue${ours ? " pilot-dialogue--ours" : ""}${reaction ? " pilot-dialogue--reaction" : ""}${question ? " pilot-question-card" : ""}${animate ? ' is-entering' : ' is-settled'}`}>
    <div className="pilot-speaker"><span>{ours ? "U" : scenario.character.initial}</span><div><strong>{name}</strong></div></div>
    <p>{ours ? children : <MarcWords text={children} />}</p>
    <ReadAloudButton text={children} label={`${name}: ${question ? 'question' : 'dialogue'}`} />
  </article>;
}

function DiscussionThread({ state, onSelect, readOnly, visible = true, choiceExtras, choiceFeedback, choicesDisabled = false }) {
  const { scenario, pilotTranscript, pilotNode } = usePilot();
  const node = pilotNode(state);
  const messages = groupPilotConversation(pilotTranscript(state));
  const revealKey = `${state.phase}:${state.nodeId}:${state.history.length}`;
  const [revealedKey, setRevealedKey] = useState(revealKey);
  const incoming = state.phase === 'decision' && state.history.length > 0 && revealedKey !== revealKey;
  const latest = messages.at(-1);
  const visibleMessages = incoming && latest?.role === 'marc' ? messages.slice(0, -1) : messages;
  const latestMessage = useRef(null);
  const previousKey = useRef(revealKey);
  useEffect(() => {
    if (revealedKey === revealKey) return;
    const timer = window.setTimeout(() => setRevealedKey(revealKey), window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 550);
    return () => window.clearTimeout(timer);
  }, [revealKey, revealedKey]);
  useEffect(() => {
    if (!visible || previousKey.current === revealKey || incoming) return;
    previousKey.current = revealKey;
    const message = latestMessage.current;
    const conversation = message?.closest('.pilot-conversation');
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
    if (conversation && getComputedStyle(conversation).overflowY === 'auto') {
      conversation.scrollTo({ top: conversation.scrollTop + message.getBoundingClientRect().top - conversation.getBoundingClientRect().top - 12, behavior });
    } else message?.scrollIntoView({ behavior, block: 'start' });
  }, [revealKey, incoming, visible]);
  return <>
    <div className="pilot-chat-thread pilot-reaction-sequence" role="log" aria-label="Discussion messages" aria-live="polite" aria-relevant="additions">
      {visibleMessages.map((message, index) => <div key={message.id} className={`pilot-chat-entry${message.role === 'us' ? ' is-ours' : message.role === 'narrator' ? ' is-narrator' : ''}`} ref={index === visibleMessages.length - 1 ? latestMessage : null}>
        {message.role === 'narrator'
          ? <aside className={`pilot-narration${index === visibleMessages.length - 1 ? ' is-entering' : ''}`} aria-label="Commentator"><span className="pilot-narration-label">Commentator</span><p>{message.text}</p><ReadAloudButton text={message.text} label="Commentator" /></aside>
          : <Speaker who={message.role === 'us' ? 'Us' : undefined} ours={message.role === 'us'} reaction={message.role === 'marc'} animate={index === visibleMessages.length - 1}>{message.text}</Speaker>}
      </div>)}
      {incoming && <div className="pilot-chat-typing" role="status" aria-label={`${scenario.character.name} is replying`}><span>{scenario.character.name}</span><i /><i /><i /></div>}
    </div>
    {state.phase === 'decision' && !incoming && <div className="pilot-chat-responses" key={state.nodeId}>
      <div className="pilot-choice-heading"><h2>How do we respond to {scenario.character.name}?</h2><span>Choose one reply.</span></div>
      <div className="pilot-choices" aria-label="Available responses to our character">{node.choices.map(option => <div key={option.id} className="pilot-choice-card">
        <button type="button" disabled={readOnly || choicesDisabled} className={`pilot-choice${state.selected === option.id ? ' is-selected' : ''}`} aria-pressed={state.selected === option.id} onClick={() => onSelect?.(option.id)}><b>{option.id}</b><span>{option.text}{choiceExtras?.(option)}</span><i aria-hidden="true">{state.selected === option.id ? '✓' : ''}</i></button>
        <ReadAloudButton text={`${option.id}. ${option.text}`} label={`Response ${option.id}`} />
      </div>)}</div>
      {choiceFeedback}
    </div>}
  </>;
}

function CharacterReaction({ state, fallback = '' }) {
  const { pilotReactionParts } = usePilot();
  const { speech, narration } = pilotReactionParts(state);
  return <>{narration && <aside className="pilot-narration" aria-label="Narration"><span className="pilot-narration-label">Narration</span><p>{narration}</p><ReadAloudButton text={narration} label="Narration" /></aside>}{(speech || fallback) && <Speaker reaction>{speech || fallback}</Speaker>}</>;
}

function RefugeSummary() {
  const { scenario } = usePilot();
  return <section className="pilot-refuge-summary" aria-label="Four shelters summary">
    <h2>{scenario.generated ? "The four stages of the journey" : "The four stages of the journey"}</h2>
    <dl>{scenario.refuges.map(refuge => <div key={refuge.id}><dt>{refuge.id} · {refuge.name}</dt><dd>{refuge.objective}</dd></div>)}</dl>
  </section>;
}

function PilotDebrief({ state }) {
  const { scenario } = usePilot();
  return <div className="pilot-debrief"><span className="pilot-eyebrow">REVIEW THE CONVERSATION</span><h1>What our choices<br />changed.</h1><p className="pilot-debrief-intro">{scenario.generated ? `Review your replies to ${scenario.character.name} and the Christian values put into practice during this conversation.` : "Review your replies and discuss how they affected the conversation with Marc."}</p>
    {state.returnPhase === "complete" && <RefugeSummary />}
    <ol>{state.history.map((entry, index) => {
      const node = scenario.nodes[entry.nodeId]; const choice = node.choices.find(item => item.id === entry.choiceId);
      return <li key={index}><div><span>{String(index + 1).padStart(2, "0")} · {node.title}</span><strong className={`pilot-quality pilot-quality--${choice.quality}`}>{qualityLabels[choice.quality]}</strong></div><blockquote>{choice.text}</blockquote><p>{choice.review}</p>{scenario.generated && <small>Christian value · {churchValues.find(value => value.id === choice.value)?.label}</small>}<small>Explore in the Bible · {node.reference}</small></li>;
    })}</ol>
  </div>;
}

function RelationshipGauge({ state }) {
  const { scenario, pilotJourneyState } = usePilot();
  const relation = pilotJourneyState(state.history);
  const value = Math.round((relation.trust + 100 - relation.frustration) / 2);
  return <aside className="pilot-relationship-rail" aria-label={`${scenario.character.name} · Attitude in the scenario`}>
    <div className="pilot-relationship-track" role="meter" aria-label={`${scenario.character.name} · Trust and peace`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-valuetext={`${value} %`}>
      <div className="pilot-relationship-fill" style={{ height: `${value}%` }} />
    </div>
    <strong>{value}<small> %</small></strong>
  </aside>;
}

function MobileStageHeading({ state }) {
  const { scenario, pilotRefuges, pilotJourneyState } = usePilot();
  const refuges = pilotRefuges(state);
  const relation = pilotJourneyState(state.history);
  const connection = Math.round((relation.trust + 100 - relation.frustration) / 2);
  return <div className="pilot-mobile-heading">
    <div className="pilot-mobile-title"><span>CHURCH MODE</span><strong>{scenario.title}</strong></div>
    <div className="pilot-mobile-progress"><span>Shelter {refuges.finished ? 4 : refuges.active.id} / 4</span><div role="meter" aria-label="Conversation connection" aria-valuemin={0} aria-valuemax={100} aria-valuenow={connection}><i style={{ width: `${connection}%` }} /></div><small>{connection}%</small></div>
  </div>;
}

function MobileDiscussionTabs({ id, active, onChange }) {
  const select = tab => { stopReadAloud(); onChange(tab); };
  const keyboard = event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault(); event.stopPropagation();
    const next = event.key === 'Home' ? 'discussion' : event.key === 'End' ? 'journey' : active === 'discussion' ? 'journey' : 'discussion';
    select(next);
    event.currentTarget.parentElement.querySelector(`[data-mobile-tab="${next}"]`)?.focus();
  };
  return <nav className="pilot-mobile-tabs" role="tablist" aria-label="Discussion workspace">
    {[['discussion', 'Discussion', 'chat'], ['journey', 'Journey', 'mountain']].map(([tab, label, icon]) => <button key={tab} id={`${id}-${tab}-tab`} data-mobile-tab={tab} type="button" role="tab" aria-selected={active === tab} aria-controls={`${id}-${tab}-panel`} tabIndex={active === tab ? 0 : -1} onClick={() => select(tab)} onKeyDown={keyboard}><PresenterIcon name={icon} /><span>{label}</span></button>)}
  </nav>;
}

export function EvangelismPilotStage({ state, onSelect, onSideSlide, onMapExpand, readOnly = false, viewReadOnly = readOnly, presenterControls = null, mainQuestion = null, choiceExtras, choiceFeedback, choicesDisabled = false }) {
  const { scenario, pilotNode, pilotRefuges, pilotEmotionalState } = usePilot();
  const mobile = useMobileDiscussion(readOnly);
  const [mobileTab, setMobileTab] = useState('discussion');
  const id = useId().replace(/:/g, '');
  useEffect(() => { setMobileTab('discussion'); }, [state.phase, state.nodeId, state.history.length]);
  const node = pilotNode(state);
  const complete = state.phase === "complete";
  const refuges = pilotRefuges(state);
  return <section className={`pilot-stage pilot-stage--${state.phase}${mobile ? ' pilot-stage--mobile' : ''}`} aria-label="Guided discussion scenario">
    <header className="pilot-stage-header">{mobile ? <MobileStageHeading state={state} /> : <><div className="pilot-brand"><span aria-hidden="true">△</span> THINK BIBLE <i>/ GUIDED DISCUSSION</i></div><span className="pilot-session-label"><b />{state.phase === "context" ? "AT BASE CAMP" : complete ? "THE SUMMIT IS REACHED" : "THE CLIMB IS UNDERWAY"}</span></>}</header>
    <div className="pilot-layout"><div id={`${id}-discussion-panel`} hidden={mobile && mobileTab !== 'discussion'} role={mobile ? 'tabpanel' : undefined} aria-labelledby={mobile ? `${id}-discussion-tab` : undefined} className={`pilot-main-column${presenterControls ? " pilot-main-column--presenter" : ""}`}>{mobile && mainQuestion}<div className="pilot-discussion-area"><RelationshipGauge state={state} /><div className="pilot-conversation">
      {state.phase === "context" ? <div className="pilot-introduction"><span className="pilot-eyebrow">{scenario.generated ? "CHURCH MODE · CUSTOM SCENARIO" : "UNBELIEVER · EVIL AND SUFFERING"}</span><h1>{scenario.title}<em className="pilot-question-card"><span className="pilot-accent-gradient">{scenario.question}</span></em></h1><ReadAloudButton text={scenario.question} label="Main question" /><section className="pilot-story-context pilot-question-card" aria-label="Story context"><h2>Story context</h2><p className="pilot-intro-context">{scenario.context}</p><ReadAloudButton text={scenario.context} label="Story context" /></section><div className="pilot-intro-panels"><div className="pilot-character"><div className="pilot-character-avatar"><MoodPortrait mood={pilotEmotionalState(state)} /></div><p><strong>{scenario.character.name}</strong><span>{scenario.character.description}</span><small>{scenario.character.detail}</small></p></div><div className="pilot-mission"><span>YOUR MISSION</span><p>{scenario.goal}</p><ReadAloudButton text={scenario.goal} label="Your mission" /></div></div><div className="pilot-intro-bottom"><span>4 shelters · 4 exchanges on the direct route</span><span>{scenario.duration} as a group</span></div></div>
        : state.phase === "debrief" ? <PilotDebrief state={state} />
          : complete ? <div className="pilot-completion"><span className="pilot-eyebrow">SHELTER 4 REACHED · A CONVERSATION TO CONTINUE</span><div className="pilot-completion-mark" aria-hidden="true">⚑</div><h1>{scenario.summit.name}.</h1><CharacterReaction state={state} fallback={scenario.summit.line} /><p>{scenario.summit.detail}</p><div className="pilot-completion-stats"><span><strong>{state.history.length}</strong> replies chosen</span><span><strong>{state.history.filter(item => scenario.nodes[item.nodeId].repair).length}</strong> opportunities to try again</span></div><RefugeSummary /></div>
            : <><div className="pilot-scene-heading"><span className="pilot-eyebrow">{`SHELTER ${node.stage} · EXCHANGE ${String(state.history.length + (state.phase === "reaction" ? 0 : 1)).padStart(2, "0")}`} · {node.title.toUpperCase()}</span></div>
              <p className="pilot-scene-context">{node.cue}</p>
              <DiscussionThread state={state} onSelect={onSelect} readOnly={readOnly} visible={!mobile || mobileTab === 'discussion'} choiceExtras={choiceExtras} choiceFeedback={choiceFeedback} choicesDisabled={choicesDisabled} />
            </>}
    </div></div>{!mobile && mainQuestion}</div><ScenarioSideCarousel state={state} onSlide={onSideSlide} onMapExpand={onMapExpand} readOnly={viewReadOnly} controls={mobile ? null : presenterControls} mobile={mobile} hidden={mobile && mobileTab !== 'journey'} panelId={`${id}-journey-panel`} labelledBy={mobile ? `${id}-journey-tab` : undefined} /></div>
    <footer className="pilot-stage-footer"><span>{scenario.title} · Scenario 01</span><span className="pilot-refuge-count">{refuges.completed.length} / 4 shelters reached</span><span>GUIDED DISCUSSION</span></footer>
    {mobile && <div className="pilot-mobile-dock">{presenterControls}<MobileDiscussionTabs id={id} active={mobileTab} onChange={setMobileTab} /></div>}
  </section>;
}

export function SharedPilotStage({ room, onSelect, onSideSlide, onMapExpand, onDismissJourney, presenterControls, choiceExtras, choiceFeedback, choicesDisabled, host }) {
  const view = room.discussion;
  const historyKey = JSON.stringify(view.history);
  const history = useMemo(() => JSON.parse(historyKey), [historyKey]);
  const scenario = { ...room.scenario, title: room.title, question: room.question, context: room.context, goal: room.goal, character: room.character, nodes: view.pastScenes };
  const refuges = { active: { id: view.refuges.active }, completed: Array.from({ length: view.refuges.completed }, (_, i) => i + 1), finished: view.refuges.finished };
  const state = { scenarioId: view.scenarioId, nodeId: view.nodeId, phase: view.phase, returnPhase: view.returnPhase, selected: view.selected, history, sideSlide: room.sideSlide, mountainExpanded: view.mountainExpanded, journeyReveal: view.journeyReveal };
  const context = { shared: true, scenario, mountainBranches: view.mountainBranches,
    pilotNode: () => view.scene, pilotTranscript: () => view.transcript, pilotEmotionalState: () => view.mood,
    pilotJourneyState: () => view.journey, pilotReactionParts: () => view.reaction || {},
    pilotTrail: snapshot => snapshot.history.length < history.length ? view.beforeTrail : view.trail,
    pilotRefuges: snapshot => snapshot.history.length < history.length ? view.beforeRefuges : refuges,
    pilotReducer: snapshot => ({ ...snapshot, history: snapshot.history.slice(0, -1), phase: 'decision' }),
  };
  const mainQuestion = <details className="pilot-main-question pilot-question-card"><summary><span className="pilot-question-label-desktop">Main question</span><span className="pilot-question-label-mobile">Question &amp; mission</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></summary><div className="pilot-main-question-content"><p className="pilot-main-question-title">{scenario.title}</p><h2 className="pilot-discussion-topic">{scenario.question}</h2><ReadAloudButton text={scenario.question} label="Main question" /><section className="pilot-mobile-mission"><h3>Your mission</h3><p>{scenario.goal}</p></section></div></details>;
  return <PilotContext.Provider value={context}>
    <EvangelismPilotStage state={state} onSelect={onSelect} onSideSlide={onSideSlide} onMapExpand={onMapExpand} viewReadOnly={!host} presenterControls={presenterControls} mainQuestion={mainQuestion} choiceExtras={choiceExtras} choiceFeedback={choiceFeedback} choicesDisabled={choicesDisabled} />
    <JourneyReveal state={state} readOnly={!host} onDismiss={onDismissJourney} />
  </PilotContext.Provider>;
}

export function EvangelismPilotPage({ scenario = evangelismPilot, onSettings }) {
  const engine = useMemo(() => createPilotEngine(scenario), [scenario]);
  return <PilotContext.Provider value={engine}><PilotSession key={scenario.id} onSettings={onSettings} /></PilotContext.Provider>;
}

function PilotSession({ onSettings }) {
  const engine = usePilot();
  const { scenario, pilotReducer, newPilotState, pilotNextNode, pilotRefuges } = engine;
  const readOnly = new URLSearchParams(window.location.search).get("screen") === "1";
  const [sessionId] = useState(getSessionId);
  const storageKey = `${storagePrefix}${sessionId}`;
  const [state, dispatch] = useReducer((current, action) => pilotSessionReducer(engine, current, action), null, () => readPilot(storageKey, engine) || newPilotState());
  const [publicState, setPublicState] = useState(() => readPilot(storageKey, engine));
  const [notice, setNotice] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);
  const [resetPending, setResetPending] = useState(false);
  const aiRequest = useRef(null);
  const active = readOnly ? publicState : state;
  const publicUrl = new URL(window.location.href);
  publicUrl.searchParams.set("screen", "1");

  useEffect(() => {
    if (readOnly) return undefined;
    setNotice("");
    try { localStorage.setItem(storageKey, JSON.stringify({ updatedAt: Date.now(), state, ...(scenario.generated ? { scenario } : {}) })); }
    catch { setNotice("Local saving is unavailable. Keep this window open during the exercise."); }
    return undefined;
  }, [state, storageKey, readOnly, scenario]);

  useEffect(() => { setAiPreview(null); }, [state.history, state.phase, state.nodeId]);
  useEffect(() => { stopReadAloud(); }, [active?.phase, active?.nodeId]);

  useEffect(() => {
    if (!readOnly) return undefined;
    const refresh = () => setPublicState(readPilot(storageKey, engine));
    const changed = event => { if (event.key === storageKey) refresh(); };
    window.addEventListener("storage", changed);
    window.addEventListener("focus", refresh);
    return () => { window.removeEventListener("storage", changed); window.removeEventListener("focus", refresh); };
  }, [readOnly, storageKey, engine]);

  useEffect(() => () => aiRequest.current?.abort(), []);
  useEffect(() => {
    if (readOnly || resetPending || journeyRevealFrame(state)) return undefined;
    const handleKey = event => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || document.querySelector('.pilot-chat-typing') || event.target.closest?.('input, textarea, select, summary, [contenteditable="true"], .pilot-side-tabs, .pilot-side-slide, .pilot-mobile-tabs')) return;
      if (state.phase === "decision" && /^[a-d]$/i.test(event.key)) { event.preventDefault(); dispatch({ type: "select", id: event.key.toUpperCase() }); }
      if (event.key === "ArrowRight" && state.phase === "reaction") { event.preventDefault(); dispatch({ type: "advance" }); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [state.phase, state.journeyReveal, readOnly, resetPending]);

  const fullscreen = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch { setNotice("Use your browser’s full-screen mode to enlarge the presentation."); }
  };
  const generateReaction = async () => {
    setAiBusy(true); setNotice(""); setAiPreview(null);
    const controller = new AbortController(); aiRequest.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 95000);
    const snapshot = { historyLength: state.history.length, nodeId: state.nodeId };
    try {
      const { requestPilotReaction } = await import("./pilot-ai.js");
      const text = await requestPilotReaction(state, { signal: controller.signal });
      setAiPreview({ ...snapshot, text });
    } catch (error) { setNotice(controller.signal.aborted ? "The AI took too long. You can continue with the prepared reaction." : error.message); }
    finally { window.clearTimeout(timeout); setAiBusy(false); aiRequest.current = null; }
  };

  const mainQuestion = !readOnly && (
    <details className="pilot-main-question pilot-question-card"><summary><span className="pilot-question-label-desktop">Main question</span><span className="pilot-question-label-mobile">Question &amp; mission</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></summary><div className="pilot-main-question-content"><p className="pilot-main-question-title">{scenario.title}</p><h2 className="pilot-discussion-topic">{scenario.question}</h2><ReadAloudButton text={scenario.question} label="Main question" /><section className="pilot-mobile-mission"><h3>Your mission</h3><p>{scenario.goal}</p></section></div></details>
  );

  const presenterControls = !readOnly && (
    <div className="pilot-presenter-controls"><div className="pilot-presenter-buttons">
        {resetPending ? <><span className="pilot-reset-question">Clear this journey and return to the start?</span><button className="pilot-primary" type="button" onClick={() => { aiRequest.current?.abort(); dispatch({ type: "restart" }); setResetPending(false); }}><PresenterIcon name="restart" />Yes, restart</button><button type="button" onClick={() => setResetPending(false)}>Cancel</button></> : <>
        {state.history.length > 0 && state.phase !== "debrief" && <button type="button" disabled={aiBusy} onClick={() => dispatch({ type: "undo" })} aria-label="Go back to your choice" title="Go back to your choice"><PresenterIcon name="undo" />Back</button>}
        {state.phase === "context" && <button className="pilot-primary" type="button" onClick={() => dispatch({ type: "start" })} aria-label="Start the discussion"><PresenterIcon name="play" />Start</button>}
        {state.phase === "decision" && <button className="pilot-primary" type="button" disabled={!state.selected} onClick={() => dispatch({ type: "confirm", startedAt: Date.now() })} aria-label={state.selected ? `Confirm response ${state.selected}` : "Choose A, B, C or D"}><PresenterIcon name="check" />{state.selected ? `Confirm ${state.selected}` : "Choose a response"}</button>}
        {state.phase === "reaction" && <button className="pilot-primary" type="button" disabled={aiBusy} onClick={() => dispatch({ type: "advance" })} aria-label={pilotNextNode(state) === "summit" ? "Reach the summit" : "Continue the conversation"}><PresenterIcon name={pilotNextNode(state) === "summit" ? "flag" : "next"} />{pilotNextNode(state) === "summit" ? "Summit" : "Continue"}</button>}
        {state.phase === "debrief" ? <button className="pilot-primary" type="button" onClick={() => dispatch({ type: "close-debrief" })} aria-label="Return to the conversation"><PresenterIcon name="undo" />Conversation</button> : state.history.length > 0 && <button className={`pilot-debrief-trigger${state.phase === "complete" ? " pilot-primary" : ""}`} type="button" disabled={aiBusy} onClick={() => dispatch({ type: "debrief" })} aria-label="Open the debrief"><PresenterIcon name="chat" />{pilotRefuges(state).pauseSuggested ? "Pause and debrief" : "Debrief"}</button>}
        <button type="button" disabled={aiBusy} onClick={() => setResetPending(true)} aria-label="Restart the exercise from the beginning"><PresenterIcon name="restart" />Restart</button>
        </>}
      </div></div>
  );

  return <main className={`pilot-page${readOnly ? " pilot-page--screen" : ""}`}>
    <div className="pilot-topbar"><a href="index.html">← Think room</a>{!readOnly && onSettings && <button type="button" onClick={onSettings}>Church mode settings</button>}<span>{readOnly ? "PUBLIC SCREEN · LOCAL PROJECTION" : scenario.generated ? "CHURCH MODE · CUSTOM SCENARIO" : "CHURCH MODE · PILOT SCENARIO"}</span><div>{!readOnly && <a href={publicUrl.toString()} target="_blank" rel="noreferrer" className="pilot-screen-link">Open the 16:9 screen ↗</a>}<button type="button" onClick={fullscreen}>⛶ Full screen</button></div></div>
    {active ? <EvangelismPilotStage state={active} readOnly={readOnly} presenterControls={presenterControls} mainQuestion={mainQuestion} onSelect={id => dispatch({ type: "select", id })} onSideSlide={slide => dispatch({ type: "side-slide", slide })} onMapExpand={expanded => dispatch({ type: "mountain-view", expanded })} /> : <div className="pilot-waiting"><h1>Waiting for the facilitator.</h1><p>For this local exercise, open the facilitator view and public screen in the same browser on this computer.</p><a href="evangelism-pilot.html">Open a pilot scenario</a></div>}
    {!readOnly && <>
      <details className="pilot-facilitator-tools"><summary>Facilitator tools · projection link and AI</summary><div className="pilot-tools-grid"><section><h2>Local projection</h2><p>Open the screen in a second tab of the same browser, then move it to the church display. This link follows the facilitator’s decisions on this computer.</p><label>Public screen link<input readOnly value={publicUrl.toString()} onFocus={event => event.target.select()} /></label><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(publicUrl.toString()); setNotice("Public screen link copied."); } catch { setNotice("Select the link above to copy it."); } }}>Copy the projection link</button></section>
        {!scenario.generated && <section><h2>Character reaction</h2><p>Prepared dialogues let you try the exercise offline. When signed in, AI can suggest an alternative reaction for you to review before projecting it.</p><button type="button" disabled={aiBusy || state.phase !== "reaction"} onClick={generateReaction}>{aiBusy ? "Marc is preparing his reaction…" : "Suggest a reaction with AI"}</button>{aiPreview && state.phase === "reaction" && <div className="pilot-ai-preview"><p>{aiPreview.text}</p><button type="button" onClick={() => { dispatch({ type: "ai-reaction", ...aiPreview }); setAiPreview(null); }}>Show this reaction</button><button type="button" onClick={() => setAiPreview(null)}>Keep the prepared reaction</button></div>}</section>}
      </div></details>
      <p className="pilot-mode-note">{scenario.generated ? <>{scenario.settings.topic} · {churchDifficultyLabels[scenario.settings.difficulty] || scenario.settings.difficulty} · {scenario.duration}<br />AI-generated scenario · progress saved on this device.</> : <>Question {pilotSourceQuestion.number} · {pilotSourceQuestion.theme} / {pilotSourceQuestion.topic} : {pilotSourceQuestion.question}<br />Local pilot · prepared dialogues · AI available on request when signed in.</>}</p>
    </>}
    {active && <JourneyReveal state={active} readOnly={readOnly} onDismiss={() => dispatch({ type: "dismiss-journey" })} />}
    {notice && <p className="pilot-notice" role="status">{notice}</p>}
  </main>;
}
