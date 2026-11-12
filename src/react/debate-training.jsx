import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DebateProjectionStage, referenceLabels, workshopLabels } from "./debate-projection.jsx";
import { conversationSlides, initialProjectionState, latestResponseSlide, normalizeProjectionState, projectionPages, projectionUrl, publishedMessages } from "../shared/debate-projection.js";

function readSession(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "null");
    if (saved?.token && saved.controlToken && saved.expiresAt > Date.now()) return { ...saved, state: normalizeProjectionState(saved.state) };
  } catch { /* An unavailable local cache does not prevent a new session. */ }
  return null;
}

export function DebateTrainingControls({ question, theme, opponent, messages, verseSupportText }) {
  const storageKey = `brother.debateProjection.${encodeURIComponent(question)}`;
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(() => readSession(storageKey));
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [authRequired, setAuthRequired] = useState(false);
  const [reference, setReference] = useState(() => session?.state.reference || { kind: "verse", title: "", body: "", source: "" });
  const [workshop, setWorkshop] = useState(() => session?.state.workshop || { mode: "reflection", prompt: "Quelle réponse proposeriez-vous ?", takeaway: "", endsAt: null });
  const dialog = useRef(null);
  const preview = session?.state || initialProjectionState({ question, theme, opponent, messages });
  const frozen = Boolean(session?.state.frozen);
  const slides = conversationSlides(preview.messages);
  const referencePages = projectionPages(preview.reference.body, 300);
  const publicLink = session ? projectionUrl(session.token) : "";
  const unpublished = JSON.stringify(publishedMessages(messages)) !== JSON.stringify(preview.messages);

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.querySelector("button")?.focus();
    const handleKey = event => {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab") return;
      const controls = [...(dialog.current?.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled)') || [])];
      const first = controls[0]; const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", handleKey); previousFocus?.focus(); };
  }, [open]);

  const remember = value => {
    setSession(value);
    try {
      if (value) localStorage.setItem(storageKey, JSON.stringify(value));
      else localStorage.removeItem(storageKey);
    } catch { /* The active session still works without persistence. */ }
  };

  const run = async action => {
    if (busy) return;
    setBusy(true); setError(""); setFeedback(""); setAuthRequired(false);
    try { await action(); }
    catch (failure) { setError(failure.message || "La commande n’a pas pu être envoyée."); setAuthRequired(failure.status === 401); }
    finally { setBusy(false); }
  };

  const control = async (action, state) => {
    const response = await fetch(window.apiUrl?.("/api/debate/projection") || "/api/debate/projection", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.controlToken}` },
      body: JSON.stringify({ action, token: session.token, ...(state ? { state } : {}) }),
    });
    const result = await response.json();
    if (response.status === 410) { remember(null); throw new Error(result.error); }
    if (!response.ok) throw new Error(result.error || "La projection n’a pas pu être mise à jour.");
  };

  const publish = (changes, notice = "Écran de l’église mis à jour.") => run(async () => {
    if (!session || (frozen && changes.frozen !== false)) return;
    const state = normalizeProjectionState({ ...session.state, ...changes });
    await control("update", state);
    remember({ ...session, state });
    setFeedback(notice);
  });

  const createSession = () => run(async () => {
    const state = initialProjectionState({ question, theme, opponent, messages });
    if (!window.aiBridge?.createDebateProjection) throw new Error("Rechargez cette page pour activer la création du lien de projection.");
    const created = await window.aiBridge.createDebateProjection(state);
    remember({ ...created, state });
    setFeedback("Lien créé. Ouvrez-le sur l’ordinateur relié aux écrans.");
  });

  return <>
    <button className="debate-training-launch" type="button" onClick={() => setOpen(true)}><span aria-hidden="true">▣</span> {session ? "Piloter la projection" : "Présenter à l’église"}<small>16:9</small></button>
    {open && createPortal(<div className="debate-training-overlay" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section className="debate-training-dialog" role="dialog" aria-modal="true" aria-labelledby="debate-training-title" ref={dialog}>
        <header className="debate-training-header"><div><span>DEBATE ROOM / MODE ÉGLISE</span><h2 id="debate-training-title">Le pupitre de formation</h2><p>Choisissez ce que l’assemblée voit, au moment voulu.</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Fermer le pupitre">×</button></header>
        {(busy || error || feedback) && <div className="debate-training-feedback debate-training-feedback--visible" aria-live="polite">
          {busy ? <p>Traitement en cours…</p> : error ? <p role="alert">{error}</p> : <p>{feedback}</p>}
          {authRequired && <button type="button" onClick={() => { setOpen(false); window.appNavigate?.("profile"); }}>Se connecter à mon compte</button>}
        </div>}
        <div className="debate-training-body">
          <div className="debate-training-controls">
            <section className="debate-training-section"><h3>01 · Lien pour les écrans</h3>
              {session ? <><label>Lien de projection<input aria-label="Lien de projection" readOnly value={publicLink} onFocus={event => event.target.select()} /></label>
                <div className="debate-training-actions"><button type="button" disabled={busy} onClick={() => run(async () => { await navigator.clipboard.writeText(publicLink); setFeedback("Lien de projection copié."); })}>Copier le lien</button><a href={publicLink} target="_blank" rel="noreferrer">Ouvrir ↗</a></div><p className="debate-training-help">Lecture seule · valable 8 heures. Le pupitre reste sur cet appareil.</p></>
                : <><p>Créez un lien à ouvrir sur l’ordinateur de projection. Les échanges déjà visibles dans le débat seront partagés.</p><button type="button" className="debate-training-primary" disabled={busy} onClick={createSession}>{busy ? "Création…" : "Créer le lien de projection"}</button></>}
            </section>
            <fieldset className="debate-training-section" disabled={!session || busy}><legend>02 · Échanges du débat</legend>
              <button type="button" className="debate-training-primary" disabled={frozen} onClick={() => {
                const nextMessages = publishedMessages(messages);
                void publish({ messages: nextMessages, slideIndex: latestResponseSlide(nextMessages) }, "Derniers échanges partagés avec l’assemblée.");
              }}>Projeter les derniers échanges{unpublished ? " •" : ""}</button>
              <div className="debate-training-pagination"><button type="button" disabled={frozen || preview.slideIndex === 0} onClick={() => publish({ slideIndex: preview.slideIndex - 1 })}>← Précédent</button><span>{slides.length ? preview.slideIndex + 1 : 0} / {slides.length}</span><button type="button" disabled={frozen || preview.slideIndex >= slides.length - 1} onClick={() => publish({ slideIndex: preview.slideIndex + 1 })}>Suivant →</button></div>
              <p className="debate-training-help">Les réponses longues sont réparties en plusieurs pages. Les nouveaux échanges attendent votre publication.</p>
            </fieldset>
            <fieldset className="debate-training-section" disabled={!session || busy}><legend>03 · Référence ou fait</legend>
              <label>Type de carte<select value={reference.kind} onChange={event => setReference({ ...reference, kind: event.target.value })}>{Object.entries(referenceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label>Titre ou référence<input maxLength={140} value={reference.title} placeholder="Ex. 1 Pierre 3:15–16" onChange={event => setReference({ ...reference, title: event.target.value })} /></label>
              <label>Texte à afficher<textarea rows={4} maxLength={2500} value={reference.body} placeholder="Passage, explication ou fait à examiner ensemble…" onChange={event => setReference({ ...reference, body: event.target.value })} /></label>
              <label>Source{reference.kind === "fact" ? " (obligatoire)" : " ou traduction"}<input maxLength={300} value={reference.source} placeholder="Livre, auteur, référence ou lien" onChange={event => setReference({ ...reference, source: event.target.value })} /></label>
              {verseSupportText && <button type="button" onClick={() => setReference({ kind: "verse", title: "Pistes bibliques à examiner", body: verseSupportText.slice(0, 2500), source: "Aide IA · références à vérifier dans la Bible" })}>Reprendre l’aide biblique</button>}
              <div className="debate-training-actions"><button type="button" disabled={frozen || (reference.kind === "fact" && !reference.source.trim())} onClick={() => publish({ reference, referencePage: 0 })}>Afficher la carte</button><button type="button" disabled={frozen} onClick={() => publish({ reference: { kind: "verse", title: "", body: "", source: "" }, referencePage: 0 })}>Effacer</button></div>
              {referencePages.length > 1 && <div className="debate-training-pagination"><button type="button" disabled={frozen || preview.referencePage === 0} onClick={() => publish({ referencePage: preview.referencePage - 1 })}>←</button><span>Carte {preview.referencePage + 1} / {referencePages.length}</span><button type="button" disabled={frozen || preview.referencePage >= referencePages.length - 1} onClick={() => publish({ referencePage: preview.referencePage + 1 })}>→</button></div>}
            </fieldset>
            <fieldset className="debate-training-section" disabled={!session || busy}><legend>04 · Atelier collectif</legend>
              <label>À afficher<select value={workshop.mode} onChange={event => setWorkshop({ ...workshop, mode: event.target.value })}>{Object.entries(workshopLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              {workshop.mode === "reflection" && <label>Question à l’assemblée<textarea rows={2} maxLength={240} value={workshop.prompt} onChange={event => setWorkshop({ ...workshop, prompt: event.target.value })} /></label>}
              {workshop.mode === "takeaway" && <label>Point clé à retenir<textarea rows={3} maxLength={240} value={workshop.takeaway} onChange={event => setWorkshop({ ...workshop, takeaway: event.target.value })} /></label>}
              <button type="button" disabled={frozen} onClick={() => publish({ workshop: { ...workshop, endsAt: preview.workshop.endsAt } })}>Afficher l’atelier</button>
              <div className="debate-training-actions">{[60, 120].map(seconds => <button type="button" key={seconds} disabled={frozen} onClick={() => publish({ workshop: { ...workshop, endsAt: Date.now() + seconds * 1000 } })}>Lancer {seconds / 60} min</button>)}<button type="button" disabled={frozen || !preview.workshop.endsAt} onClick={() => publish({ workshop: { ...preview.workshop, endsAt: null } })}>Arrêter</button></div>
            </fieldset>
            {session && <button type="button" className="debate-training-end" disabled={busy} onClick={() => run(async () => { await control("end"); remember(null); setFeedback("Projection terminée. Le lien est désactivé."); })}>Terminer la projection</button>}
          </div>
          <div className="debate-training-preview"><div className="debate-training-preview-heading"><h3>Aperçu de l’écran de l’église</h3><span>16:9 · 3 zones</span></div><DebateProjectionStage state={preview} />
            <fieldset className="debate-training-display-controls" disabled={!session || busy}><legend>Disposition à l’écran</legend><div className="debate-training-actions">{[["all", "3 zones"], ["chat", "Agrandir le débat"], ["reference", "Agrandir la carte"], ["workshop", "Agrandir l’atelier"]].map(([focus, label]) => <button type="button" key={focus} disabled={frozen} aria-pressed={preview.focus === focus} onClick={() => publish({ focus })}>{label}</button>)}</div>
              <button className="debate-training-freeze" type="button" aria-pressed={frozen} onClick={() => {
                const now = Date.now();
                const changes = frozen ? { frozen: false, frozenAt: null, workshop: { ...preview.workshop, endsAt: preview.workshop.endsAt ? preview.workshop.endsAt + now - preview.frozenAt : null } } : { frozen: true, frozenAt: now };
                void publish(changes, frozen ? "Projection reprise." : "Écran figé. Le minuteur est également en pause.");
              }}>{frozen ? "▶ Reprendre la projection" : "Ⅱ Figer l’écran"}</button>
            </fieldset>
            <p className="debate-training-note">Les cartes sont préparées par le formateur. Les réponses de l’IA servent à la discussion et restent à examiner ensemble.</p>
          </div>
        </div>
      </section>
    </div>, document.body)}
  </>;
}
