import React, { useEffect, useState } from "react";
import { conversationSlides, initialProjectionState, normalizeProjectionState, projectionPages } from "../shared/debate-projection.js";

export const referenceLabels = { verse: "Passage biblique", fact: "Fait & source", definition: "Définition" };
export const workshopLabels = { reflection: "À vous de répondre", takeaway: "À retenir", reasoning: "Construire sa réponse" };

function useClock(enabled) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!enabled) return undefined;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [enabled]);
  return now;
}

export function DebateProjectionStage({ state, demo = false }) {
  const slides = conversationSlides(state.messages);
  const current = slides[state.slideIndex];
  const previous = current && state.messages[current.messageIndex - 1];
  const referencePages = projectionPages(state.reference.body, 300);
  const now = useClock(Boolean(state.workshop.endsAt) && !state.frozen);
  const clockNow = state.frozen && state.frozenAt ? state.frozenAt : now;
  const seconds = Math.max(0, Math.ceil(((state.workshop.endsAt || clockNow) - clockNow) / 1000));
  const turns = state.messages.filter(message => message.role === "user").length;
  const hasReference = Boolean(state.reference.body || state.reference.title);
  return <section className={`debate-stage debate-stage--${state.focus}`} aria-label="Projection de la formation">
    <header className="debate-stage-header">
      <div className="debate-stage-brand"><span className="debate-stage-emblem" aria-hidden="true">✦</span><span>THINK BIBLE <i>/ FORMATION</i></span></div>
      <span className={`debate-stage-status${state.frozen ? " is-paused" : ""}`}><i />{demo ? "DÉMONSTRATION" : state.frozen ? "ÉCRAN FIGÉ" : "DEBATE ROOM"}</span>
    </header>
    <div className="debate-stage-title"><span>{state.theme || "Apologétique"}</span><h1 title={state.question}>{state.question || "Une question. Plusieurs angles. Une réflexion ensemble."}</h1></div>
    <div className="debate-stage-grid">
      <section className="debate-stage-panel debate-stage-chat" aria-label="Le débat">
        <div className="debate-stage-panel-heading"><span><i className="debate-stage-dot" /> LE DÉBAT</span><small>{current ? `${state.slideIndex + 1} / ${slides.length}` : "EN ATTENTE"}</small></div>
        {previous && <div className="debate-stage-context"><span>{previous.role === "user" ? "L’assemblée" : "L’objection précédente"}</span><p>{previous.text.length > 150 ? `${previous.text.slice(0, 150).trim()}…` : previous.text}</p></div>}
        <div className={`debate-stage-response${current?.role === "user" ? " is-assembly" : ""}`} key={`${state.slideIndex}-${current?.text}`}>
          <div className="debate-stage-speaker"><span aria-hidden="true">{current?.role === "user" ? "A" : "IA"}</span><strong>{current?.role === "user" ? "Réponse de l’assemblée" : "Partenaire de débat · IA"}</strong>{current?.pages > 1 && <small>Partie {current.page}/{current.pages}</small>}</div>
          <p className="debate-stage-answer">{current?.text || "Le formateur partagera ici les échanges du débat."}</p>
        </div>
        <div className="debate-stage-chat-footer"><span>{turns} réponse{turns !== 1 ? "s" : ""} partagée{turns !== 1 ? "s" : ""}</span><span>Écouter · Examiner · Répondre</span></div>
      </section>
      <section className="debate-stage-panel debate-stage-reference" aria-label="Références et faits">
        <div className="debate-stage-panel-heading"><span>↗ {referenceLabels[state.reference.kind].toUpperCase()}</span><small>{referencePages.length > 1 ? `${state.referencePage + 1} / ${referencePages.length}` : "ÉCLAIRAGE"}</small></div>
        <div className="debate-stage-reference-content" key={`${state.referencePage}-${state.reference.body}`}>
          <h2>{state.reference.title || "Approfondir ensemble"}</h2>
          <p>{referencePages[state.referencePage] || (hasReference ? "" : "Un passage, une définition ou un fait sourcé peut être affiché ici par le formateur.")}</p>
        </div>
        {state.reference.source && <div className="debate-stage-source">Source · {state.reference.source}</div>}
      </section>
      <section className="debate-stage-panel debate-stage-workshop" aria-label="Atelier collectif">
        <div className="debate-stage-panel-heading"><span>✦ L’ATELIER</span><small>RÉFLEXION COLLECTIVE</small></div>
        <h2>{workshopLabels[state.workshop.mode]}</h2>
        {state.workshop.mode === "reasoning" ? <ol className="debate-stage-reasoning"><li><b>01</b> Identifier l’objection</li><li><b>02</b> Examiner les sources</li><li><b>03</b> Formuler une réponse claire</li></ol> : <p className="debate-stage-prompt">{state.workshop.mode === "takeaway" ? state.workshop.takeaway || "Le formateur partagera le point clé de cette discussion." : state.workshop.prompt}</p>}
        {state.workshop.endsAt && <div className="debate-stage-timer"><strong>{`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`}</strong><span>{seconds > 0 ? "pour réfléchir ensemble" : "Partageons nos réponses"}</span></div>}
      </section>
    </div>
    <footer className="debate-stage-footer"><span>Une pratique de l’apologétique, dans le respect et l’écoute.</span><span>{demo ? "APERÇU DU MODE ÉGLISE" : "FORMATION ÉGLISE · 16:9"}</span></footer>
  </section>;
}

const demoState = initialProjectionState({
  theme: "Foi & dialogue", question: "Comment expliquer sa foi avec clarté et respect ?",
  messages: [
    { role: "user", text: "Je commencerais par écouter la question de la personne, puis j’expliquerais ce qui nourrit ma confiance en Jésus." },
    { role: "assistant", text: "Écouter est un bon début. Mais comment distinguer une conviction personnelle d’une raison que ton interlocuteur peut examiner ? Propose un argument précis, puis explique pourquoi il mérite d’être considéré." },
  ],
});
demoState.reference = { kind: "verse", title: "1 Pierre 3:15–16", body: "Lisez le passage dans votre Bible.\n\nRepérez ce qu’il enseigne sur la manière de répondre et sur l’attitude à adopter envers son interlocuteur.", source: "Référence biblique · activité de lecture" };

export function DebateProjectionScreen() {
  const demo = new URLSearchParams(window.location.search).get("demo") === "1";
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [state, setState] = useState(demo ? demoState : null);
  const [status, setStatus] = useState(demo ? "live" : "loading");
  const [error, setError] = useState("");
  const [fullscreenError, setFullscreenError] = useState("");
  useEffect(() => {
    if (demo) return undefined;
    if (!token) { setStatus("invalid"); setError("Ouvrez le lien partagé depuis la Debate Room."); return undefined; }
    let stopped = false;
    let timer;
    let controller;
    const refresh = async () => {
      controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch(`/api/debate/projection?token=${encodeURIComponent(token)}`, { cache: "no-store", signal: controller.signal });
        const payload = await response.json();
        if (!response.ok) throw Object.assign(new Error(payload.error || "Projection indisponible."), { status: response.status });
        if (!stopped) {
          if (payload.status === "live") setState(normalizeProjectionState(payload.state));
          setStatus(payload.status); setError("");
        }
        if (payload.status === "ended") return;
      } catch (failure) {
        if (!stopped) {
          setError([400, 404].includes(failure.status) ? failure.message : "Connexion interrompue · nouvelle tentative automatique…");
          if ([400, 404].includes(failure.status)) { setStatus("invalid"); return; }
        }
      } finally { window.clearTimeout(timeout); }
      if (!stopped) timer = window.setTimeout(refresh, 2000);
    };
    void refresh();
    return () => { stopped = true; window.clearTimeout(timer); controller?.abort(); };
  }, [demo, token]);

  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
      setFullscreenError("");
    } catch { setFullscreenError("Utilisez le mode plein écran du navigateur."); }
  };
  return <main className="debate-projection-shell">
    <div className="debate-projection-toolbar"><span>Think Bible · Projection église{demo ? " · Démonstration" : ""}</span><button type="button" onClick={fullscreen}>⛶ Plein écran</button></div>
    {status === "ended" ? <section className="debate-projection-notice"><span>✦</span><h1>La session est terminée.</h1><p>Merci pour ce temps de réflexion ensemble.</p></section>
      : state ? <DebateProjectionStage state={state} demo={demo} />
        : <section className="debate-projection-notice"><span>✦</span><h1>{status === "invalid" ? "Lien de projection" : "Connexion à la formation…"}</h1><p>{error || "L’écran suivra les contenus partagés par le formateur."}</p></section>}
    {(state && error || fullscreenError) && <p className="debate-projection-feedback" role="status">{fullscreenError || error}</p>}
  </main>;
}
