import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

const bridge = () => window.churchBridge;

function splitCourseText(text, maxLength = 1800) {
  const pages = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + maxLength, text.length);
    if (end < text.length) {
      const boundary = Math.max(text.lastIndexOf("\n", end), text.lastIndexOf(" ", end));
      if (boundary > start + Math.floor(maxLength / 2)) end = boundary + 1;
    }
    pages.push(text.slice(start, end));
    start = end;
  }
  return pages;
}

function churchErrorMessage(failure) {
  const message = String(failure?.message || "");
  if (/Could not find the table .*church_memberships|schema cache/i.test(message)) {
    return "La bibliothèque d’études de l’église n’est pas encore configurée. La création et l’accès aux sessions restent disponibles.";
  }
  return message || "Une erreur est survenue.";
}

function OpenSessions() {
  const [name, setName] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [confirmCreatePassword, setConfirmCreatePassword] = useState("");
  const [courseFile, setCourseFile] = useState(null);
  const [courseContent, setCourseContent] = useState(null);
  const [sourceDocumentName, setSourceDocumentName] = useState("");
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [created, setCreated] = useState(null);
  const [qr, setQr] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [found, setFound] = useState(null);
  const [activeSessions, setActiveSessions] = useState([]);
  const [activeSessionsError, setActiveSessionsError] = useState("");
  const [activeSessionsLoaded, setActiveSessionsLoaded] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminSession, setAdminSession] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!created?.accessCode) { setQr(""); return; }
    const url = new URL("projection.html", window.location.href);
    url.searchParams.set("code", created.accessCode);
    QRCode.toDataURL(url.toString(), { width: 220, margin: 1, errorCorrectionLevel: "M" })
      .then(setQr).catch(() => setError("Le QR code n’a pas pu être créé."));
  }, [created?.accessCode]);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const sessions = await bridge().getActiveOpenSessions();
        if (!cancelled) { setActiveSessions(sessions); setActiveSessionsError(""); setActiveSessionsLoaded(true); }
      } catch (failure) {
        if (!cancelled) { setActiveSessionsError(failure.message || "Impossible de charger les sessions actives."); setActiveSessionsLoaded(true); }
      }
    };
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 10000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  async function act(action, success) {
    setBusy(true); setError(""); setMessage("");
    try { await action(); if (success) setMessage(success); }
    catch (failure) { setError(failure.message || "La demande n’a pas abouti."); }
    finally { setBusy(false); }
  }

  const reviewPages = courseContent?.sourceText ? splitCourseText(courseContent.sourceText) : [];

  return <div className="church-session-hub">
    {error && <p className="church-feedback is-error" role="alert">{error}</p>}
    {message && <p className="church-feedback" role="status">{message}</p>}
    <section className="church-panel">
      <div><h2>{courseContent ? "Relire le cours et placer les activités" : "Créer une session"}</h2><p>{courseContent ? "Le texte extrait est le cours. Les jeux et challenges viennent après les passages que vous choisissez." : "Choisissez un nom, un mot de passe, une date facultative et importez le document du cours."}</p></div>
      {!courseContent ? <form className="church-form" onSubmit={event => { event.preventDefault(); if (createPassword !== confirmCreatePassword) { setError("Les deux mots de passe ne correspondent pas."); return; } act(async () => {
        const result = await bridge().prepareOpenSession(courseFile);
        setCourseContent(result.courseContent); setSourceDocumentName(result.sourceDocumentName);
      }, "Le document est extrait. Vérifiez le texte avant de continuer."); }}>
        <label className="church-label">Nom de la session<input required minLength="2" maxLength="120" value={name} onChange={event => setName(event.target.value)} placeholder="Ex. Étude biblique de vendredi" /></label>
        <label className="church-label">Date et heure (facultatif)<input type="datetime-local" value={scheduledAt} onChange={event => setScheduledAt(event.target.value)} /></label>
        <label className="church-label">Mot de passe administrateur<input type={showCreatePassword ? "text" : "password"} required minLength="8" maxLength="128" autoComplete="new-password" value={createPassword} onChange={event => setCreatePassword(event.target.value)} placeholder="8 caractères minimum" /><button type="button" className="is-quiet" onClick={() => setShowCreatePassword(value => !value)}>{showCreatePassword ? "Masquer" : "Afficher"}</button></label>
        <label className="church-label">Confirmer le mot de passe<input type={showCreatePassword ? "text" : "password"} required minLength="8" maxLength="128" autoComplete="new-password" value={confirmCreatePassword} onChange={event => setConfirmCreatePassword(event.target.value)} /></label>
        <label className="church-label">Document du cours (PDF ou photo, 2,5 Mo maximum)<input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required onChange={event => setCourseFile(event.target.files?.[0] || null)} /></label>
        {busy && <div className="church-ai-progress" role="status"><span /><progress aria-label="Analyse du cours" />Analyse du cours en cours…</div>}
        <button disabled={busy || !courseFile}>Analyser le cours</button>
      </form> : <div className="church-course-review">
        <p className="church-feedback">Document analysé : <strong>{sourceDocumentName}</strong>. Vérifiez la transcription contre le document, surtout si le fichier est une photo ou un scan. L’IA peut mal lire certains passages.</p>
        <p>Le cours sera présenté comme une lecture, dans l’ordre du document. Corrigez la transcription au besoin, puis choisissez où apparaîtront les jeux.</p>
        <label className="church-label">Texte original extrait · modifiable<textarea rows="12" maxLength="60000" value={courseContent.sourceText || ""} onChange={event => setCourseContent(current => ({ ...current, sourceText: event.target.value }))} /></label>
        <div className="church-course-book-preview" aria-label="Aperçu de la lecture"><span>APERÇU DE LA LECTURE · {reviewPages.length} passages</span>{reviewPages.slice(0, 3).map((page, index) => <article className="church-course-book-page" key={index}><small>Passage {index + 1}</small><p>{page}</p></article>)}{reviewPages.length > 3 && <p>La lecture continue sur {reviewPages.length - 3} autres passages.</p>}</div>
        <h3>Jeux et challenges à insérer dans le cours</h3>
        {(courseContent.activities || []).map((activity, index) => <article className="church-course-activity" key={index}>
          <label className="church-label">Question<input maxLength="800" value={activity.prompt} onChange={event => setCourseContent(current => ({ ...current, activities: current.activities.map((item, itemIndex) => itemIndex === index ? { ...item, prompt: event.target.value } : item) }))} /></label>
          <label className="church-label">Insérer après<select value={Math.min(activity.afterPage || 0, Math.max(0, reviewPages.length - 1))} onChange={event => setCourseContent(current => ({ ...current, activities: current.activities.map((item, itemIndex) => itemIndex === index ? { ...item, afterPage: Number(event.target.value) } : item) }))}>{reviewPages.map((_, pageIndex) => <option key={pageIndex} value={pageIndex}>Passage {pageIndex + 1}</option>)}</select></label>
          <label className="church-label">Type<select value={activity.kind} onChange={event => setCourseContent(current => ({ ...current, activities: current.activities.map((item, itemIndex) => itemIndex === index ? { ...item, kind: event.target.value } : item) }))}><option value="multiple_choice">Choix multiple</option><option value="true_false">Vrai ou faux</option><option value="event_order">Remettre en ordre</option><option value="matching">Association</option><option value="verse_challenge">Défi de référence biblique</option></select></label>
          {(activity.options || []).map((option, optionIndex) => <label className="church-label" key={optionIndex}>Réponse {optionIndex + 1}<input maxLength="300" value={option} onChange={event => setCourseContent(current => ({ ...current, activities: current.activities.map((item, itemIndex) => itemIndex === index ? { ...item, options: item.options.map((answer, answerIndex) => answerIndex === optionIndex ? event.target.value : answer) } : item) }))} /></label>)}
          <label className="church-label">Bonne réponse<select value={activity.correctIndex} onChange={event => setCourseContent(current => ({ ...current, activities: current.activities.map((item, itemIndex) => itemIndex === index ? { ...item, correctIndex: Number(event.target.value) } : item) }))}>{(activity.options || []).map((option, optionIndex) => <option value={optionIndex} key={optionIndex}>{option || `Réponse ${optionIndex + 1}`}</option>)}</select></label>
          <button type="button" className="is-quiet" onClick={() => setCourseContent(current => ({ ...current, activities: current.activities.filter((_, itemIndex) => itemIndex !== index) }))}>Retirer cette activité</button>
        </article>)}
        {!(courseContent.activities || []).length && <p className="church-empty">Aucun jeu proposé pour ce document. Vous pouvez en ajouter un ici.</p>}
        <button type="button" className="is-quiet" disabled={(courseContent.activities || []).length >= 8 || !reviewPages.length} onClick={() => setCourseContent(current => ({ ...current, activities: [...(current.activities || []), { kind: "multiple_choice", prompt: "", options: ["", "", "", ""], correctIndex: 0, explanation: "", afterPage: 0 }] }))}>Ajouter un jeu ou un challenge</button>
        {busy && <div className="church-ai-progress" role="status"><span /><progress aria-label="Publication de la session" />Publication de la session…</div>}
        <div className="church-review-actions"><button type="button" className="is-quiet" disabled={busy} onClick={() => setCourseContent(null)}>Retour au formulaire</button><button type="button" disabled={busy || !name.trim() || !courseContent.sourceText?.trim()} onClick={() => act(async () => {
          const session = await bridge().createOpenSession(name, createPassword, scheduledAt ? new Date(scheduledAt).toISOString() : null, courseContent, sourceDocumentName, courseFile);
          setCreated(session); setAdminCode(session.accessCode);
        }, "Session validée. Votre code et votre QR sont prêts.")}>Valider et créer le QR code</button></div>
      </div>}
      {created && <div className="church-session-created" role="status"><div><span className="church-live-indicator">SESSION PRÊTE</span><h3>{created.name}</h3><p>Code public</p><strong className="church-session-code">{created.accessCode}</strong>{created.scheduledAt && <p>Programmée le {new Date(created.scheduledAt).toLocaleString("fr-CA", { dateStyle: "long", timeStyle: "short" })}</p>}<a className="church-projection-link" href={`projection.html?code=${created.accessCode}`} target="_blank" rel="noreferrer">Ouvrir la page de la session ↗</a><a className="church-projection-link" href={`session-admin.html?code=${created.accessCode}`} target="_blank" rel="noreferrer">Ouvrir le pupitre administrateur ↗</a></div>{qr && <img className="church-session-qr" src={qr} alt={`QR code pour rejoindre ${created.name}`} />}</div>}
    </section>

    <section className="church-panel"><div><h2>Sessions en direct</h2><p>Sessions actuellement ouvertes · actualisation automatique</p></div>{activeSessionsError ? <p className="church-feedback is-error" role="alert">{activeSessionsError}</p> : activeSessions.length ? <div className="church-active-session-list">{activeSessions.map(session => <article className="church-active-session" key={session.accessCode}><div><span className="church-live-indicator">EN DIRECT</span><strong>{session.name}</strong><small>Code public · {session.accessCode}{session.startedAt ? ` · démarrée à ${new Date(session.startedAt).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}` : ""}</small></div><div className="church-active-session-links"><a href={`projection.html?code=${session.accessCode}`} target="_blank" rel="noreferrer">Lien public ↗</a><a href={`session-admin.html?code=${session.accessCode}`} target="_blank" rel="noreferrer">Lien admin ↗</a></div></article>)}</div> : activeSessionsLoaded ? <p className="church-empty">Aucune session n’est en direct pour le moment.</p> : <p className="church-empty">Chargement des sessions actives…</p>}</section>

    <section className="church-panel"><div><h2>Rejoindre une session</h2><p>Entrez le code public à 8 chiffres ou scannez le QR code partagé par l’organisateur. Aucun compte n’est nécessaire.</p></div><form className="church-inline-form" onSubmit={event => { event.preventDefault(); act(async () => { setFound(null); setFound(await bridge().findOpenSession(joinCode)); }, "Session trouvée."); }}><input inputMode="numeric" autoComplete="one-time-code" maxLength="8" pattern="[0-9]{8}" aria-label="Code public à 8 chiffres" value={joinCode} onChange={event => setJoinCode(event.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="Code à 8 chiffres" required /><button disabled={busy || joinCode.length !== 8}>Rechercher</button></form>{found && <div className="church-session-result"><strong>{found.name}</strong><span>{found.status === "live" ? "En direct" : found.status === "ended" ? "Terminée" : found.scheduledAt ? `Programmée · ${new Date(found.scheduledAt).toLocaleString("fr-CA", { dateStyle: "medium", timeStyle: "short" })}` : "En attente de l’administrateur"}</span><a className="church-projection-link" href={`projection.html?code=${found.accessCode}`}>Ouvrir cette session ↗</a></div>}</section>

    <section className="church-panel"><div><h2>Espace administrateur</h2><p>Ouvrez le pupitre pour lire le cours, partager un passage ou lancer les jeux au bon moment.</p></div><form className="church-form" onSubmit={event => { event.preventDefault(); act(async () => { setAdminSession(await bridge().startOpenSession(adminCode, adminPassword)); setShowAdminPassword(false); }, "Session démarrée."); }}><label className="church-label">Code de la session<input inputMode="numeric" maxLength="8" pattern="[0-9]{8}" value={adminCode} onChange={event => setAdminCode(event.target.value.replace(/\D/g, "").slice(0, 8))} required /></label><label className="church-label">Mot de passe administrateur<input type={showAdminPassword ? "text" : "password"} autoComplete="current-password" value={adminPassword} onChange={event => setAdminPassword(event.target.value)} required /><button type="button" className="is-quiet" onClick={() => setShowAdminPassword(value => !value)}>{showAdminPassword ? "Masquer" : "Afficher"}</button></label><button disabled={busy || adminCode.length !== 8}>Démarrer la session</button></form>{adminSession && <div className="church-session-result"><strong>{adminSession.name}</strong><span>{adminSession.status === "live" ? "La session est en direct." : "La session est terminée."}</span>{adminSession.status === "live" && <><a className="church-projection-link" href={`session-admin.html?code=${adminSession.accessCode}`} target="_blank" rel="noreferrer">Ouvrir le pupitre de lecture ↗</a><a className="church-projection-link" href={`projection.html?code=${adminSession.accessCode}`} target="_blank" rel="noreferrer">Ouvrir les écrans de projection ↗</a><button type="button" className="is-quiet" disabled={busy} onClick={() => act(async () => { setAdminSession(await bridge().endOpenSession(adminCode, adminPassword)); setAdminPassword(""); }, "Session terminée.")}>Terminer la session</button></>}</div>}</section>
  </div>;
}

export function ChurchSpace() {
  const [user, setUser] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [churches, setChurches] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [activeChurchId, setActiveChurchId] = useState("");
  const [studies, setStudies] = useState([]);
  const [activities, setActivities] = useState([]);
  const [media, setMedia] = useState([]);
  const [aiDraft, setAiDraft] = useState(null);
  const [language, setLanguage] = useState("");
  const [translatedContent, setTranslatedContent] = useState(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [churchMembers, setChurchMembers] = useState([]);
  const [pendingChurches, setPendingChurches] = useState([]);
  const [liveSession, setLiveSession] = useState(null);
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [note, setNote] = useState("");
  const [query, setQuery] = useState("");
  const [churchName, setChurchName] = useState("");
  const [city, setCity] = useState("");
  const [studyTitle, setStudyTitle] = useState("");
  const [theme, setTheme] = useState("");
  const [duration, setDuration] = useState(45);
  const [outline, setOutline] = useState("");
  const [quizKind, setQuizKind] = useState("multiple_choice");
  const [quizPrompt, setQuizPrompt] = useState("");
  const [quizChoices, setQuizChoices] = useState(["", "", "", ""]);
  const [correctChoice, setCorrectChoice] = useState(0);
  const [quizExplanation, setQuizExplanation] = useState("");
  const [teamMode, setTeamMode] = useState(true);
  const [joinedTeam, setJoinedTeam] = useState(null);
  const [myAnswerResult, setMyAnswerResult] = useState(null);
  const [replayResults, setReplayResults] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function refresh() {
    try {
      setError("");
      const nextUser = await bridge().getUser();
      setUser(nextUser);
      if (!nextUser) { setMemberships([]); setChurches([]); setStudies([]); return; }
      const rows = await bridge().getMemberships();
      setMemberships(rows);
      setChurches(rows.filter(row => row.church).map(row => row.church));
      if (nextUser.isGlobalAdmin) setPendingChurches(await bridge().getPendingChurches());
      const preferredChurch = localStorage.getItem(`church-default-${nextUser.id}`) || activeChurchId;
      const currentId = rows.some(row => row.church_id === preferredChurch && row.status === "active")
        ? preferredChurch : rows.find(row => row.status === "active")?.church_id || "";
      setActiveChurchId(currentId);
      if (currentId) {
        const [nextStudies, requests, currentSession, nextMembers] = await Promise.all([
          bridge().getStudies(currentId), bridge().getChurchAdminData(currentId), bridge().getLiveSession(currentId), bridge().getChurchMembers(currentId),
        ]);
        setStudies(nextStudies);
        setPendingMembers(requests);
        setChurchMembers(nextMembers);
        setLiveSession(currentSession);
      } else { setStudies([]); setPendingMembers([]); setChurchMembers([]); setLiveSession(null); }
    } catch (failure) {
      if (/Could not find the table .*church_(?:memberships|churches)|schema cache.*church_(?:memberships|churches)/i.test(String(failure?.message || ""))) {
        setMemberships([]); setChurches([]); setStudies([]); setPendingMembers([]); setChurchMembers([]); setLiveSession(null);
        return;
      }
      setError(churchErrorMessage(failure));
    }
  }

  useEffect(() => {
    refresh();
    const onScreen = event => { if (event.detail?.id === "my-church") refresh(); };
    const onAuth = () => refresh();
    window.addEventListener("app:screen-change", onScreen);
    window.addEventListener("church:auth-change", onAuth);
    return () => { window.removeEventListener("app:screen-change", onScreen); window.removeEventListener("church:auth-change", onAuth); };
  }, []);

  useEffect(() => {
    setSelectedStudy(null);
    setNote("");
    if (!activeChurchId) { setStudies([]); return; }
    bridge().getStudies(activeChurchId).then(setStudies).catch(failure => setError(failure.message));
  }, [activeChurchId]);

  useEffect(() => {
    if (!selectedStudy?.id || !user) { setActivities([]); return; }
    bridge().getStudyActivities(selectedStudy.id).then(setActivities).catch(failure => setError(failure.message));
  }, [selectedStudy?.id, selectedStudy?.status, user?.id]);

  useEffect(() => {
    setTranslatedContent(null); setShowTranslation(false); setAiDraft(null);
    if (!selectedStudy?.id || !user) { setMedia([]); return; }
    bridge().getStudyMedia(selectedStudy.id).then(setMedia).catch(failure => setError(failure.message));
  }, [selectedStudy?.id, user?.id]);

  useEffect(() => {
    setJoinedTeam(null);
    setMyAnswerResult(null);
    if (!liveSession?.id || !user || !activeMembership) return;
    bridge().joinLiveSession(liveSession.id).then(setJoinedTeam).catch(failure => setError(failure.message));
  }, [liveSession?.id, user?.id, activeChurchId]);

  useEffect(() => {
    const deadline = Number(liveSession?.state?.deadlineAt || 0);
    if (!deadline) { setSecondsLeft(0); return; }
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick();
    const timer = window.setInterval(tick, 500);
    return () => window.clearInterval(timer);
  }, [liveSession?.state?.deadlineAt]);

  useEffect(() => {
    if (!activeChurchId) return;
    return bridge().subscribeLiveSession(activeChurchId, event => {
      const next = event.new?.status === "active" ? event.new : null;
      setLiveSession(current => next || (current?.id === event.old?.id ? null : current));
      if (!next && event.old?.id) setMessage("La session Live est terminée.");
    });
  }, [activeChurchId]);

  async function run(action, success) {
    setBusy(true); setError(""); setMessage("");
    try { await action(); if (success) setMessage(success); await refresh(); }
    catch (failure) { setError(churchErrorMessage(failure)); }
    finally { setBusy(false); }
  }

  async function openStudy(study) {
    setSelectedStudy(study);
    setStudyTitle(study.title);
    setTheme(study.theme || "");
    setDuration(study.duration_minutes);
    setOutline((study.content?.sections || []).map(section => typeof section === "string" ? section : section.text || "").join("\n"));
    try { setNote(await bridge().getStudyNote(study.id)); }
    catch (failure) { setError(failure.message); }
  }

  async function addQuestion(event) {
    event.preventDefault();
    const options = quizKind === "true_false" ? ["Vrai", "Faux"] : quizChoices.map(value => value.trim()).filter(Boolean);
    await run(async () => {
      await bridge().createStudyActivity({ studyId: selectedStudy.id, kind: quizKind, prompt: quizPrompt, options, correctAnswer: Number(correctChoice), explanation: quizExplanation, duration: 30, points: 100 });
      setActivities(await bridge().getStudyActivities(selectedStudy.id));
      setQuizPrompt(""); setQuizChoices(["", "", "", ""]); setQuizExplanation(""); setCorrectChoice(0);
    }, "Question ajoutée à l’étude.");
  }

  async function answerLiveQuestion(answer) {
    if (!liveSession?.state?.activityId || myAnswerResult) return;
    try {
      setBusy(true); setError("");
      const result = await bridge().submitLiveAnswer(liveSession.id, liveSession.state.activityId, answer);
      setMyAnswerResult(result);
    } catch (failure) { setError(failure.message || "Réponse non enregistrée."); }
    finally { setBusy(false); }
  }

  async function answerReplay(activity, answer) {
    try {
      setBusy(true); setError("");
      const result = await bridge().checkReplayAnswer(activity.id, answer);
      setReplayResults(current => ({ ...current, [activity.id]: result }));
    } catch (failure) { setError(failure.message || "Réponse non vérifiée."); }
    finally { setBusy(false); }
  }

  async function runStudyAi(action) {
    if (!selectedStudy) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const result = action === "import"
        ? await bridge().importStudySupport(selectedStudy.id, document.querySelector("#church-study-import")?.files?.[0])
        : await bridge().generateStudy(selectedStudy.id, theme);
      setAiDraft(result.content);
      setMessage(action === "import" ? "Support analysé. Vérifiez et corrigez la proposition avant de l’appliquer." : "Étude proposée. Vérifiez le contenu avant de l’appliquer.");
    } catch (failure) { setError(failure.message || "L’analyse n’a pas abouti."); }
    finally { setBusy(false); }
  }

  async function applyAiDraft() {
    if (!aiDraft || !selectedStudy) return;
    setBusy(true); setError("");
    try {
      const nextTitle = String(aiDraft.title || studyTitle).slice(0, 180);
      const nextTheme = String(aiDraft.theme || theme).slice(0, 500);
      const sections = (aiDraft.sections || []).map(section => typeof section === "string" ? { text: section, source: "proposition_ia" } : section);
      const content = { ...selectedStudy.content, sections };
      await bridge().updateStudy(selectedStudy.id, { title: nextTitle, theme: nextTheme, content });
      setStudyTitle(nextTitle); setTheme(nextTheme); setOutline(sections.map(section => section.text || "").join("\n"));
      setSelectedStudy(current => ({ ...current, title: nextTitle, theme: nextTheme, content }));
      for (const question of (aiDraft.questions || []).slice(0, 6)) {
        const options = (question.options || []).slice(0, 4).map(String);
        if (options.length >= 2 && Number.isInteger(Number(question.correctIndex))) await bridge().createStudyActivity({ studyId: selectedStudy.id, kind: "multiple_choice", prompt: String(question.prompt || "Question proposée par l’IA"), options, correctAnswer: Number(question.correctIndex), explanation: String(question.explanation || "Proposition IA à vérifier"), duration: 30, points: 100 });
      }
      setAiDraft(null); setActivities(await bridge().getStudyActivities(selectedStudy.id));
      setMessage("Contenu appliqué au brouillon. Les questions générées restent modifiables avant publication.");
    } catch (failure) { setError(failure.message || "Impossible d’appliquer la proposition."); }
    finally { setBusy(false); }
  }

  async function loadTranslation() {
    if (!selectedStudy || !language.trim()) return;
    setBusy(true); setError("");
    try { const result = await bridge().translateStudy(selectedStudy.id, language); setTranslatedContent(result.content); setShowTranslation(true); setMessage(result.verseNotice); }
    catch (failure) { setError(failure.message || "Traduction indisponible."); }
    finally { setBusy(false); }
  }

  const activeMembership = memberships.find(row => row.church_id === activeChurchId && row.status === "active");
  const canTeach = ["manager", "teacher"].includes(activeMembership?.role);

  return <div className="church-space">
    <header className="church-hero"><span className="church-eyebrow">ÉTUDE · PARTAGE · RENCONTRE</span><h1>Sessions</h1><p>Créez une session, partagez son code ou programmez-la pour plus tard.</p></header>
    <OpenSessions />
    {!user ? null : <>
      {error && <p className="church-feedback is-error" role="alert">{error}</p>}
      {message && <p className="church-feedback" role="status">{message}</p>}

      {memberships.length > 0 && <section className="church-panel"><label className="church-label" htmlFor="church-picker">Votre église</label><select id="church-picker" value={activeChurchId} onChange={event => setActiveChurchId(event.target.value)}>
        {memberships.map(row => <option key={row.id} value={row.church_id}>{row.church?.name || "Église"} · {row.status === "active" ? row.role : "demande en attente"}</option>)}
      </select><button type="button" className="is-quiet" disabled={!activeMembership} onClick={() => { localStorage.setItem(`church-default-${user.id}`, activeChurchId); setMessage("Église par défaut enregistrée sur cet appareil."); }}>Définir par défaut</button></section>}

      {activeMembership && <>
        <section className="church-section-heading"><div><span>ESPACE PRIVÉ</span><h2>{churches.find(church => church.id === activeChurchId)?.name || "Études"}</h2></div><span>{activeMembership.role}</span></section>
        {canTeach && <section className="church-panel"><h3>Créer une étude</h3><form className="church-form" onSubmit={event => { event.preventDefault(); run(async () => { await bridge().saveStudy({ church_id: activeChurchId, title: studyTitle, theme, duration_minutes: Number(duration), status: "draft", content: { sections: [], activities: [] } }); setStudyTitle(""); setTheme(""); }, "Brouillon créé."); }}>
          <label className="church-label">Titre<input required maxLength="180" value={studyTitle} onChange={event => setStudyTitle(event.target.value)} placeholder="Ex. La foi dans l’épreuve" /></label>
          <label className="church-label">Thème<input maxLength="500" value={theme} onChange={event => setTheme(event.target.value)} placeholder="Sujet ou passage biblique" /></label>
          <label className="church-label">Durée<select value={duration} onChange={event => setDuration(Number(event.target.value))}><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">60 minutes</option></select></label>
          <button disabled={busy} type="submit">Créer le brouillon</button>
        </form></section>}
        {pendingMembers.length > 0 && canTeach && <section className="church-panel"><h3>Demandes d’adhésion</h3>{pendingMembers.map(member => <div className="church-request" key={member.id}><span>Membre · {member.user_id.slice(0, 8)}</span><button disabled={busy} onClick={() => run(() => bridge().reviewMembership(member.id, "active"), "Demande acceptée.")}>Accepter</button><button className="is-quiet" disabled={busy} onClick={() => run(() => bridge().reviewMembership(member.id, "rejected"), "Demande refusée.")}>Refuser</button></div>)}</section>}
        {activeMembership.role === "manager" && <section className="church-panel"><h3>Membres et animateurs</h3>{churchMembers.map(member => <div className="church-request" key={member.id}><span>Membre · {member.user_id.slice(0, 8)}</span><select aria-label={`Rôle de ${member.user_id.slice(0, 8)}`} value={member.role} onChange={event => run(() => bridge().setChurchMemberRole(member.id, event.target.value), "Rôle mis à jour.")}><option value="member">Membre</option><option value="teacher">Animateur</option><option value="manager">Gestionnaire</option></select></div>)}</section>}
        {liveSession ? <section className="church-panel church-live-panel"><div className="church-live-top"><div><span className="church-live-indicator">SESSION EN DIRECT</span><h3>{liveSession.state?.title}</h3></div>{canTeach && <button className="church-end-live" disabled={busy} onClick={() => run(async () => { await bridge().endLiveSession(liveSession, { id: liveSession.study_id }); setLiveSession(null); setSelectedStudy(current => current?.id === liveSession.study_id ? { ...current, status: "archived" } : current); }, "Session terminée et étude archivée.")}>Terminer</button>}</div><p>{liveSession.state?.theme}</p>{liveSession.state?.mode === "quiz" && liveSession.state?.question ? <div className="church-live-question"><span>QUIZ · {secondsLeft > 0 ? `${secondsLeft} s` : "Temps écoulé"}</span><strong>{liveSession.state.question.prompt}</strong>{liveSession.state.question.options.map((option, index) => <button key={index} disabled={busy || myAnswerResult || secondsLeft === 0 || canTeach || joinedTeam === null} onClick={() => answerLiveQuestion(index)}>{option}</button>)}{myAnswerResult && <p role="status">{myAnswerResult.correct ? `Bonne réponse · +${myAnswerResult.points} points` : "Réponse enregistrée · 0 point"}</p>}{liveSession.state.scoreboard?.length > 0 && <ol className="church-scoreboard">{liveSession.state.scoreboard.map((score, index) => <li key={index}>{liveSession.state.teamMode ? `Équipe ${["rouge", "bleu", "vert", "jaune"][score.team]}` : `Participant ${score.rank}`}<strong>{score.score}</strong></li>)}</ol>}</div> : <div className="church-live-content"><span>ÉTAPE {(liveSession.state?.currentIndex || 0) + 1} / {Math.max(1, liveSession.state?.sections?.length || 0)}</span><strong>{liveSession.state?.sections?.[liveSession.state?.currentIndex || 0] || "La session est prête."}</strong>{liveSession.state?.verse && <small>{liveSession.state.verse}</small>}</div>}{joinedTeam !== null && liveSession.state?.teamMode && <p className="church-team-label">Vous jouez dans l’équipe {[["rouge", "#a94d47"],["bleu", "#4d75a9"],["vert", "#4d8558"],["jaune", "#a78b30"]][joinedTeam]?.[0]}.</p>}{canTeach && <><div className="church-live-actions"><button disabled={busy || (liveSession.state?.currentIndex || 0) === 0} onClick={() => run(() => bridge().updateLiveSession(liveSession.id, { ...liveSession.state, mode: "teaching", currentIndex: Math.max(0, (liveSession.state?.currentIndex || 0) - 1) }))}>Précédent</button><button disabled={busy || (liveSession.state?.currentIndex || 0) >= (liveSession.state?.sections?.length || 1) - 1} onClick={() => run(() => bridge().updateLiveSession(liveSession.id, { ...liveSession.state, mode: "teaching", currentIndex: (liveSession.state?.currentIndex || 0) + 1 }))}>Suivant</button></div><div className="church-activity-launches">{activities.filter(activity => activity.enabled !== false).map(activity => <button key={activity.id} disabled={busy} onClick={() => run(async () => { const state = await bridge().startLiveActivity(liveSession.id, activity.id); setLiveSession(current => ({ ...current, state })); setMyAnswerResult(null); }, "Question lancée.")}>Lancer le quiz · {activity.prompt}</button>)}{liveSession.state?.mode === "quiz" && <button className="is-secondary" disabled={busy} onClick={() => run(async () => { const state = { ...liveSession.state, mode: "teaching", activityId: null, question: null, deadlineAt: null }; await bridge().updateLiveSession(liveSession.id, state); setLiveSession(current => ({ ...current, state })); }, "Retour à l’étude.")}>Reprendre l’étude</button>}</div></> }<a className="church-projection-link" target="_blank" rel="noreferrer" href={`projection.html?token=${encodeURIComponent(liveSession.projection_token)}`}>Ouvrir l’écran de projection ↗</a><a className="church-projection-link" target="_blank" rel="noreferrer" href={`projection.html?token=${encodeURIComponent(liveSession.projection_token)}&join=1`}>Lien visiteur · participation sur téléphone ↗</a></section> : canTeach && <section className="church-panel"><h3>Lancer la session Live</h3><p>Les membres connectés suivront la progression en temps réel. L’écran de projection s’ouvre sur ordinateur, sans installation.</p><label className="church-label">Étude<select value={selectedStudy?.id || ""} onChange={event => { const study = studies.find(item => item.id === event.target.value); if (study) openStudy(study); }}><option value="">Choisir une étude</option>{studies.filter(study => study.status !== "archived").map(study => <option key={study.id} value={study.id}>{study.title}</option>)}</select></label><label className="church-label">Mode de jeu<select value={teamMode ? "teams" : "individual"} onChange={event => setTeamMode(event.target.value === "teams")}><option value="teams">Équipes équilibrées</option><option value="individual">Individuel</option></select></label><button disabled={busy || !selectedStudy || selectedStudy.status === "draft"} onClick={() => run(async () => { const session = await bridge().startLiveSession(selectedStudy, teamMode); setLiveSession(session); }, "Session Live lancée.")}>Lancer l’étude publiée</button>{selectedStudy?.status === "draft" && <small>Publiez d’abord cette étude pour la lancer.</small>}</section>}
        <section className="church-study-list"><div className="church-section-heading"><div><span>VOTRE BIBLIOTHÈQUE</span><h2>Études</h2></div><span>{studies.length}</span></div>
          {studies.length === 0 ? <p className="church-empty">Aucune étude pour le moment.</p> : studies.map(study => <article className={`church-study-card ${selectedStudy?.id === study.id ? "is-selected" : ""}`} key={study.id}>
            <button className="church-study-open" onClick={() => openStudy(study)}><span>{study.status === "draft" ? "BROUILLON" : study.status.toUpperCase()}</span><strong>{study.title}</strong><small>{study.theme || "Étude biblique"} · {study.duration_minutes} min</small></button>
            {canTeach && <button className="church-study-copy" disabled={busy} onClick={() => run(() => bridge().saveStudy({ church_id: activeChurchId, title: `${study.title} — copie`, theme: study.theme, duration_minutes: study.duration_minutes, status: "draft", content: study.content }), "Copie créée sans modifier l’original.")}>Dupliquer</button>}
          </article>)}
        </section>
        {selectedStudy && canTeach && selectedStudy.status === "draft" && <section className="church-panel church-ai-tools"><h3>Créer ou importer le contenu</h3><p>L’IA propose un plan à vérifier. Rien n’est publié automatiquement.</p><label className="church-label">Thème pour générer une étude<input maxLength="500" value={theme} onChange={event => setTheme(event.target.value)} placeholder="Ex. la foi dans l’épreuve" /></label><button disabled={busy || theme.trim().length < 3} onClick={() => runStudyAi("generate")}>Proposer une étude avec l’IA</button><label className="church-label">Importer les notes du pasteur (PDF ou photo, 2,5 Mo max)<input id="church-study-import" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" /></label><button className="is-secondary" disabled={busy} onClick={() => runStudyAi("import")}>Analyser le support</button>{aiDraft && <div className="church-ai-preview"><strong>Aperçu · proposition IA</strong><h4>{aiDraft.title}</h4><p>{aiDraft.theme}</p>{(aiDraft.sections || []).map((section, index) => <p key={index}><b>{section.source === "original" ? "Extrait du support" : "Proposition IA"}:</b> {typeof section === "string" ? section : section.text}</p>)}{aiDraft.questions?.length > 0 && <p>{aiDraft.questions.length} question(s) proposée(s), réponses à vérifier dans le quiz après application.</p>}<button disabled={busy} onClick={applyAiDraft}>Appliquer au brouillon pour le modifier</button><button className="is-quiet" onClick={() => setAiDraft(null)}>Ignorer</button></div>}</section>}
        {selectedStudy && canTeach && <section className="church-panel"><h3>Préparer l’étude</h3><p>Le contenu de l’animateur reste privé jusqu’à la publication.</p><form className="church-form" onSubmit={event => { event.preventDefault(); run(async () => { const oldSections = selectedStudy.content?.sections || []; const sections = outline.split("\n").map(line => line.trim()).filter(Boolean).map(text => oldSections.find(old => (typeof old === "string" ? old : old.text) === text) || ({ text, source: "original" })); const changes = { title: studyTitle, theme, duration_minutes: Number(duration), content: { ...selectedStudy.content, sections } }; await bridge().updateStudy(selectedStudy.id, changes); setSelectedStudy(current => ({ ...current, ...changes })); }, "Étude enregistrée."); }}><label className="church-label">Titre<input required maxLength="180" value={studyTitle} onChange={event => setStudyTitle(event.target.value)} /></label><label className="church-label">Thème<input maxLength="500" value={theme} onChange={event => setTheme(event.target.value)} /></label><label className="church-label">Durée<select value={duration} onChange={event => setDuration(Number(event.target.value))}><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">60 minutes</option></select></label><label className="church-label church-outline-label">Plan de l’étude<textarea rows="7" maxLength="12000" value={outline} onChange={event => setOutline(event.target.value)} placeholder="Une ligne par point, question ou référence biblique" /></label><button disabled={busy}>Enregistrer le brouillon</button></form></section>}
        {selectedStudy && canTeach && selectedStudy.status === "draft" && <section className="church-panel"><h3>Créer un quiz</h3><p>Les bonnes réponses sont stockées séparément et restent invisibles aux participants. Pour les défis d’ordre et d’association, chaque choix représente une séquence ou une paire candidate.</p><form className="church-form" onSubmit={addQuestion}><label className="church-label">Type de question<select value={quizKind} onChange={event => setQuizKind(event.target.value)}><option value="multiple_choice">Choix multiple</option><option value="true_false">Vrai ou faux</option><option value="verse_completion">Verset à compléter</option><option value="event_order">Remettre en ordre · séquence</option><option value="matching">Association · paire correcte</option><option value="verse_challenge">Défi de référence biblique</option></select></label><label className="church-label">Question<input required maxLength="800" value={quizPrompt} onChange={event => setQuizPrompt(event.target.value)} placeholder="Quelle référence soutient ce point ?" /></label>{quizKind !== "true_false" && quizChoices.map((choice, index) => <label className="church-label" key={index}>Réponse {index + 1}<input required maxLength="200" value={choice} onChange={event => setQuizChoices(current => current.map((item, i) => i === index ? event.target.value : item))} /></label>)}<label className="church-label">Bonne réponse<select value={correctChoice} onChange={event => setCorrectChoice(Number(event.target.value))}>{(quizKind === "true_false" ? ["Vrai", "Faux"] : quizChoices).map((choice, index) => <option value={index} key={index}>{choice || `Réponse ${index + 1}`}</option>)}</select></label><label className="church-label">Explication après la réponse<input maxLength="500" value={quizExplanation} onChange={event => setQuizExplanation(event.target.value)} /></label><button disabled={busy}>Ajouter la question</button></form>{activities.map(activity => <div className="church-request" key={activity.id}><span>{({ true_false: "Vrai ou faux", verse_completion: "Verset à compléter", event_order: "Ordre", matching: "Association", verse_challenge: "Défi référence", multiple_choice: "QCM" }[activity.kind] || "Quiz")} · {activity.prompt}</span><label className="church-inline-toggle"><input type="checkbox" checked={activity.enabled !== false} onChange={event => run(async () => { await bridge().setStudyActivityEnabled(activity.id, event.target.checked); setActivities(await bridge().getStudyActivities(selectedStudy.id)); }, "Activité mise à jour.")} />Incluse</label><button className="is-quiet" disabled={busy} onClick={() => run(async () => { await bridge().deleteStudyActivity(activity.id); setActivities(await bridge().getStudyActivities(selectedStudy.id)); }, "Question supprimée.")}>Supprimer</button></div>)}</section>}
        {selectedStudy && canTeach && selectedStudy.status === "draft" && <button className="church-publish" disabled={busy || !outline.trim()} onClick={() => run(async () => { await bridge().updateStudy(selectedStudy.id, { title: studyTitle, theme, duration_minutes: Number(duration), content: { ...selectedStudy.content, sections: outline.split("\n").map(line => line.trim()).filter(Boolean).map(text => ({ text })) } }); await bridge().publishStudy(selectedStudy.id); setSelectedStudy(current => ({ ...current, status: "published" })); }, "Étude publiée dans votre église.")}>Publier l’étude</button>}
        {selectedStudy?.status === "archived" && activities.length > 0 && <section className="church-panel church-replay"><h3>Replay des quiz</h3><p>Rejouez à votre rythme. Vos résultats restent personnels.</p>{activities.map(activity => { const translated = showTranslation ? translatedContent?.activities?.find(item => item.id === activity.id) : null; return <div className="church-replay-question" key={activity.id}><strong>{translated?.prompt || activity.prompt}</strong>{(translated?.options || activity.options).map((option, index) => <button key={index} disabled={busy || replayResults[activity.id]} onClick={() => answerReplay(activity, index)}>{option}</button>)}{replayResults[activity.id] && <p role="status">{replayResults[activity.id].correct ? "Bonne réponse." : "Ce n’est pas la bonne réponse."} {replayResults[activity.id].explanation}</p>}</div>; })}</section>}
        {selectedStudy && <section className="church-panel church-study-media"><h3>Supports de l’étude</h3>{canTeach && selectedStudy.status === "draft" && <label className="church-label">Ajouter une image, une vidéo ou un document (100 Mo max)<input type="file" accept="application/pdf,text/plain,image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={event => { const file = event.target.files?.[0]; if (!file) return; run(async () => { await bridge().uploadStudyMedia(activeChurchId, selectedStudy.id, file); setMedia(await bridge().getStudyMedia(selectedStudy.id)); event.target.value = ""; }, "Support ajouté à l’étude."); }} /></label>}{media.length === 0 ? <p>Aucun support ajouté.</p> : <div className="church-media-grid">{media.map(item => <article key={item.id}>{item.media_type === "image" ? <a href={item.url} target="_blank" rel="noreferrer"><img src={item.url} alt={item.original_name} /></a> : item.media_type === "video" ? <video controls preload="metadata" src={item.url} aria-label={item.original_name} /> : <a href={item.url} target="_blank" rel="noreferrer">Ouvrir {item.original_name}</a>}<span>{item.original_name}{item.is_ai_illustration ? " · Illustration IA, non documentaire" : ""}</span>{canTeach && selectedStudy.status === "draft" && <button className="is-quiet" onClick={() => run(async () => { await bridge().deleteStudyMedia(item); setMedia(await bridge().getStudyMedia(selectedStudy.id)); }, "Support supprimé.")}>Supprimer</button>}</article>)}</div>}</section>}
        {selectedStudy && selectedStudy.status !== "draft" && <section className="church-panel church-translation"><h3>Ma langue d’affichage</h3><p>Les références bibliques restent intactes. Une traduction IA ne remplace pas une édition biblique autorisée.</p><form className="church-inline-form" onSubmit={event => { event.preventDefault(); loadTranslation(); }}><input value={language} onChange={event => setLanguage(event.target.value)} placeholder="Ex. English, العربية" aria-label="Langue" /><button disabled={busy || !language.trim()}>Traduire cette étude</button></form>{translatedContent && <><button className="is-quiet" onClick={() => setShowTranslation(!showTranslation)}>{showTranslation ? "Revenir à l’original" : "Afficher la traduction"}</button>{showTranslation && <div className="church-translated-content">{(translatedContent.sections || []).map((section, index) => <p key={index}>{typeof section === "string" ? section : section.text}</p>)}</div>}</>}</section>}
        {selectedStudy && <section className="church-panel church-notes"><h3>Mes notes · {selectedStudy.title}</h3><p>Ces notes sont privées et visibles uniquement par vous.</p><textarea rows="5" maxLength="12000" value={note} onChange={event => setNote(event.target.value)} placeholder="Ajouter une réflexion personnelle…" /><button disabled={busy} onClick={() => run(() => bridge().saveStudyNote(selectedStudy.id, note), "Notes enregistrées.")}>Enregistrer mes notes</button></section>}
      </>}

    </>}
  </div>;
}

export function SessionAdmin() {
  const initialCode = new URLSearchParams(window.location.search).get("code") || "";
  const [code, setCode] = useState(/^\d{8}$/.test(initialCode) ? initialCode : "");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState(null);
  const [draft, setDraft] = useState([]);
  const [selectedText, setSelectedText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function run(action, success) {
    setBusy(true); setError(""); setMessage("");
    try { await action(); if (success) setMessage(success); }
    catch (failure) { setError(failure.message || "La commande n’a pas abouti."); }
    finally { setBusy(false); }
  }

  const pages = session?.courseContent?.sourceText ? splitCourseText(session.courseContent.sourceText) : draft;
  function captureSelection() {
    const value = window.getSelection?.()?.toString().trim() || "";
    if (value && value.length <= 1200) setSelectedText(value);
  }
  async function publish(index) {
    await run(async () => {
      const updated = await bridge().controlOpenSession(code, password, pages, index);
      setSession(updated); setSelectedText("");
    }, "Le passage du cours est affiché sur les écrans.");
  }
  async function shareSelection(mode) {
    return shareText(selectedText, mode);
  }
  async function shareText(text, mode = "passage") {
    await run(async () => {
      setSession(await bridge().highlightOpenSessionText(code, password, text, mode));
    }, mode === "word" ? "Le mot est surligné sur les écrans." : "Le passage est affiché sur les écrans.");
  }
  async function launchActivity(index) {
    await run(async () => {
      setSession(await bridge().startOpenSessionActivity(code, password, index));
      setSelectedText("");
    }, "Le jeu est lancé sur les écrans.");
  }
  async function resumeReading() {
    await run(async () => setSession(await bridge().startOpenSessionActivity(code, password, null)), "Retour à la lecture du cours.");
  }

  return <main className="projection-admin-page">
    <header><a href="index.html">← Sessions</a><span>ESPACE ADMINISTRATEUR</span>{session?.status === "live" && <a href={`projection.html?code=${code}`} target="_blank" rel="noreferrer">Ouvrir l’écran public ↗</a>}</header>
    <div className="church-space">
      <div className="church-hero"><span className="church-eyebrow">PILOTAGE DE LA RENCONTRE</span><h1>{session?.name || "Session"}</h1><p>Lis le cours et envoie un passage ou un mot aux écrans de la rencontre.</p></div>
      {error && <p className="church-feedback is-error" role="alert">{error}</p>}{message && <p className="church-feedback" role="status">{message}</p>}
      {!session ? <section className="church-panel"><h2>Ouvrir le pupitre admin</h2><form className="church-form" onSubmit={event => { event.preventDefault(); run(async () => { const result = await bridge().startOpenSession(code, password); setSession(result); setDraft(result.projectionSlides || []); }, "Accès admin ouvert."); }}><label className="church-label">Code de la session<input inputMode="numeric" maxLength="8" pattern="[0-9]{8}" value={code} onChange={event => setCode(event.target.value.replace(/\D/g, "").slice(0, 8))} required /></label><label className="church-label">Mot de passe administrateur<input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required /></label><button disabled={busy || code.length !== 8}>Ouvrir le pupitre</button></form></section>
        : session.status !== "live" ? <section className="church-panel"><h2>Session terminée</h2><p>Cette session ne peut plus être redémarrée.</p></section>
        : <>
          <section className="church-panel"><span className="church-live-indicator">SESSION EN DIRECT</span><h2>{session.name}</h2><p>Code public · {session.accessCode}</p><a className="church-projection-link" href={`projection.html?code=${code}`} target="_blank" rel="noreferrer">Ouvrir l’écran public ↗</a></section>
          {session.projectionActivity && <section className="church-panel church-current-projection"><strong>{session.projectionActivity.kind === "highlight" ? session.projectionActivity.mode === "word" ? "Mot surligné à l’écran" : "Passage partagé à l’écran" : "Jeu en cours"}</strong><p>{session.projectionActivity.text || session.projectionActivity.prompt}</p><button type="button" className="is-quiet" disabled={busy} onClick={resumeReading}>Reprendre la lecture</button></section>}
          <section className="church-panel church-course-reader"><div><span className="church-eyebrow">COURS ORIGINAL · {session.sourceDocumentName || "DOCUMENT IMPORTÉ"}</span><h2>Lecture du cours</h2><p>Sélectionne un mot ou un passage pour le partager sur tous les écrans. Tu peux aussi afficher chaque passage complet.</p></div>
            {selectedText && <div className="church-reader-selection"><strong>Ta sélection</strong><p>{selectedText}</p><button type="button" disabled={busy} onClick={() => shareSelection("passage")}>Afficher ce passage</button>{/^\S+$/.test(selectedText) && <button type="button" className="is-quiet" disabled={busy} onClick={() => shareSelection("word")}>Surligner ce mot</button>}</div>}
            <div className="church-course-book">{pages.map((page, index) => <article className="church-course-book-page" key={index}>
              <div className="church-reader-page-heading"><small>Passage {index + 1} sur {pages.length}</small></div>
              {(page.split(/\n+/).filter(line => line.trim()).length ? page.split(/\n+/).filter(line => line.trim()) : [page]).map((line, lineIndex) => <p className="church-reader-line" role="button" tabIndex="0" title="Clique pour afficher ce passage; sélectionne un mot pour le surligner" key={lineIndex} onClick={() => { if (!window.getSelection?.()?.toString().trim()) void shareText(line, "passage"); }} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); void shareText(line, "passage"); } }} onMouseUp={captureSelection} onTouchEnd={captureSelection}>{line}</p>)}
              {(session.courseContent?.activities || []).filter(item => (Number(item.afterPage) || 0) === index).map((item, activityIndex) => {
                const actualIndex = session.courseContent.activities.indexOf(item);
                return <aside className="church-reader-activity" key={`${actualIndex}-${activityIndex}`}><span>JEU APRÈS CE PASSAGE</span><strong>{item.prompt}</strong><button type="button" disabled={busy} onClick={() => launchActivity(actualIndex)}>Lancer le jeu</button></aside>;
              })}
            </article>)}</div>
            {session.courseContent?.activities?.length > 0 && <details><summary>Voir toutes les activités ({session.courseContent.activities.length})</summary>{session.courseContent.activities.map((item, index) => <article className="church-course-activity" key={index}><strong>{item.prompt}</strong><p>Après le passage {(Number(item.afterPage) || 0) + 1} · {item.kind}</p><p>Réponse attendue : {item.options?.[item.correctIndex]}</p><p>{item.explanation}</p><button type="button" disabled={busy} onClick={() => launchActivity(index)}>Lancer ce jeu</button></article>)}</details>}
          </section>
          <section className="church-panel church-session-controller"><h2>Navigation</h2><p>Le public suit le passage actuellement choisi.</p><div className="church-admin-slide-actions"><button type="button" disabled={busy || session.projectionIndex <= 0} onClick={() => publish(Math.max(0, session.projectionIndex - 1))}>Passage précédent</button><span>{pages.length ? session.projectionIndex + 1 : 0} / {pages.length}</span><button type="button" disabled={busy || session.projectionIndex >= pages.length - 1} onClick={() => publish(Math.min(pages.length - 1, session.projectionIndex + 1))}>Passage suivant</button></div><button type="button" className="church-end-live" disabled={busy} onClick={() => run(async () => { setSession(await bridge().endOpenSession(code, password)); setPassword(""); }, "La session est terminée.")}>Terminer la session</button></section>
        </>}
    </div>
  </main>;
}

export function ProjectionScreen() {
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");
  const [closed, setClosed] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [publicAnswer, setPublicAnswer] = useState(null);
  const [publicAnswerBusy, setPublicAnswerBusy] = useState(false);
  const [guestMode, setGuestMode] = useState(false);
  const [guestTeam, setGuestTeam] = useState(null);
  const [guestToken, setGuestToken] = useState("");
  const [guestAnswer, setGuestAnswer] = useState(null);
  const [guestBusy, setGuestBusy] = useState(false);
  const [projectionToken, setProjectionToken] = useState("");
  const [publicCodeMode, setPublicCodeMode] = useState(false);
  const [publicSession, setPublicSession] = useState(null);
  const guestClient = useRef(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessCode = params.get("code") || "";
    if (/^\d{8}$/.test(accessCode)) {
      setPublicCodeMode(true);
      let cancelled = false;
      let timer;
      const refresh = async () => {
        const response = await fetch(`/api/sessions/status?code=${encodeURIComponent(accessCode)}`, { cache: "no-store" });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error || "Cette session est introuvable.");
        if (!cancelled) { setPublicSession(data); setClosed(data?.status === "ended"); }
      };
      refresh().catch(failure => setError(failure.message || "Session indisponible."));
      timer = window.setInterval(() => { void refresh().catch(failure => setError(failure.message)); }, 5000);
      return () => { cancelled = true; window.clearInterval(timer); };
    }
    const token = params.get("token");
    if (!token || !/^[0-9a-f-]{36}$/i.test(token)) { setError("Lien de projection invalide."); return; }
    const isGuest = new URLSearchParams(window.location.search).get("join") === "1";
    setProjectionToken(token); setGuestMode(isGuest);
    let cancelled = false;
    let timer;
    async function start() {
      try {
        if (isGuest) {
          const configResponse = await fetch("/api/supabase/config");
          const config = await configResponse.json();
          if (!config.configured || !window.supabase?.createClient) throw new Error("Participation visiteur indisponible.");
          guestClient.current ||= window.supabase.createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
          const storageKey = `church-guest-${token}`;
          let participantToken = localStorage.getItem(storageKey);
          if (!participantToken) { participantToken = crypto.randomUUID(); localStorage.setItem(storageKey, participantToken); }
          const { data: team, error: joinError } = await guestClient.current.rpc("join_church_live_guest", { target_projection_token: token, new_guest_token: participantToken });
          if (joinError) throw joinError;
          const participant = { team: Number(team), guestToken: participantToken };
          if (!cancelled) { setGuestTeam(participant.team); setGuestToken(participant.guestToken); }
        }
        const refresh = async () => {
          const updateResponse = await fetch(`/api/church/projection?token=${encodeURIComponent(token)}`, { cache: "no-store" });
          if (!updateResponse.ok) throw new Error("Lien de projection temporairement indisponible.");
          const data = await updateResponse.json();
          if (cancelled) return;
          setSession(data);
          setClosed(!data || new Date(data.expiresAt) <= new Date());
        };
        await refresh();
        timer = window.setInterval(() => { void refresh().catch(failure => setError(failure.message)); }, 2500);
      } catch (failure) { if (!cancelled) setError(failure.message || "Impossible d’ouvrir la projection."); }
    }
    start();
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);
  useEffect(() => { setGuestAnswer(null); }, [session?.state?.activityId]);
  useEffect(() => { setPublicAnswer(null); }, [publicSession?.projectionActivity?.instance]);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 500); return () => window.clearInterval(timer); }, []);
  useEffect(() => {
    const keydown = event => { if (event.key.toLowerCase() === "f") document.documentElement.requestFullscreen?.(); };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, []);
  const state = session?.state || {};
  const remaining = Math.max(0, Math.ceil((Number(state.deadlineAt) - now) / 1000));
  const publicSlideIndex = publicSession?.projectionIndex || 0;
  const publicSlideImage = publicSession?.projectionMedia?.find(item => item.slideIndex === publicSlideIndex && item.url);
  async function answerGuest(index) {
    try {
      setGuestBusy(true); setError("");
      const { data, error: answerError } = await guestClient.current.rpc("submit_church_guest_answer", { target_projection_token: projectionToken, target_guest_token: guestToken, target_activity: state.activityId, submitted_answer: index });
      if (answerError) throw answerError;
      setGuestAnswer(data);
    }
    catch (failure) { setError(failure.message || "Réponse non enregistrée."); }
    finally { setGuestBusy(false); }
  }
  async function answerPublicActivity(index) {
    try {
      setPublicAnswerBusy(true); setError("");
      const response = await fetch("/api/sessions/answer", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ accessCode: publicSession.accessCode, answer: index, activityInstance: publicSession.projectionActivity?.instance }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Réponse non enregistrée.");
      setPublicAnswer(result);
    } catch (failure) { setError(failure.message || "Réponse non enregistrée."); }
    finally { setPublicAnswerBusy(false); }
  }
  if (publicCodeMode) return <main className="projection-page"><header><span>SESSION BIBLE STUDY</span></header>{error ? <p role="alert">{error}</p> : !publicSession ? <p>Recherche de la session…</p> : <section className="projection-content"><span>{publicSession.status === "live" ? "SESSION EN DIRECT" : publicSession.status === "ended" ? "SESSION TERMINÉE" : "SESSION PROGRAMMÉE"}</span><h1>{publicSession.name}</h1>{publicSession.scheduledAt && <p className="projection-step">{new Date(publicSession.scheduledAt).toLocaleString("fr-CA", { dateStyle: "full", timeStyle: "short" })}</p>}{publicSession.status === "live" ? publicSession.projectionActivity?.kind === "highlight" ? <><p className="projection-step">{publicSession.projectionActivity.mode === "word" ? "MOT À RETENIR" : "PASSAGE DU COURS"}</p><strong className={publicSession.projectionActivity.mode === "word" ? "projection-highlight-word" : "projection-slide-text"}>{publicSession.projectionActivity.text}</strong></> : publicSession.projectionActivity ? <><p className="projection-step">JEU · choisissez une réponse</p><strong>{publicSession.projectionActivity.prompt}</strong><div className="projection-options">{(publicSession.projectionActivity.options || []).map((option, index) => <button type="button" key={index} disabled={publicAnswerBusy || Boolean(publicAnswer)} onClick={() => answerPublicActivity(index)}>{option}</button>)}</div>{publicAnswer && <p role="status">{publicAnswer.correct ? "Bonne réponse !" : "Ce n’est pas la bonne réponse."} {publicAnswer.explanation}</p>}</> : publicSession.projectionSlides?.length ? <><p className="projection-step">LECTURE DU COURS · passage {publicSlideIndex + 1} sur {publicSession.projectionSlides.length}</p><strong className="projection-slide-text">{publicSession.projectionSlides[publicSlideIndex]}</strong>{publicSlideImage && <img className="projection-slide-image" src={publicSlideImage.url} alt={publicSlideImage.alt} loading="lazy" referrerPolicy="no-referrer" />}</> : <strong>L’administrateur prépare la lecture du cours.</strong> : publicSession.status === "ended" ? <strong>Cette rencontre est terminée.</strong> : <strong>En attente du début de la lecture.</strong>}<p>Code de la session</p><strong className="church-session-code">{publicSession.accessCode}</strong></section>}<footer>Partagez cette page avec les participants. Aucun compte n’est nécessaire.</footer></main>;
  return <main className={`projection-page ${guestMode ? "is-guest" : ""}`}><header><span>MON ÉGLISE · BIBLE STUDY LIVE</span>{!guestMode && <button type="button" onClick={() => document.documentElement.requestFullscreen?.()}>Plein écran</button>}</header>{error ? <p role="alert">{error}</p> : closed ? <p>Cette session Live est terminée.</p> : !session ? <p>Connexion à la session…</p> : guestMode ? <section className="projection-content guest-content"><span>PARTICIPATION ANONYME</span><h1>{state.title}</h1>{guestTeam !== null && <p>Vous jouez dans l’équipe { ["rouge", "bleu", "vert", "jaune"][guestTeam] }.</p>}{state.mode === "quiz" && state.question ? <><p className="projection-step">QUIZ · {remaining > 0 ? `${remaining} s` : "Temps écoulé"}</p><strong>{state.question.prompt}</strong><div className="guest-answer-options">{state.question.options.map((option, index) => <button key={index} disabled={guestBusy || guestAnswer || remaining === 0} onClick={() => answerGuest(index)}>{option}</button>)}</div>{guestAnswer && <p role="status">{guestAnswer.correct ? `Bonne réponse · +${guestAnswer.points} points` : "Réponse enregistrée · 0 point"}</p>}<ol className="projection-scoreboard">{(state.scoreboard || []).map((score, index) => <li key={index}>{state.teamMode ? `Équipe ${["rouge", "bleu", "vert", "jaune"][score.team]}` : `Participant ${score.rank}`}<strong>{score.score}</strong></li>)}</ol></> : <p>L’animateur prépare la prochaine étape. Cette page se synchronisera automatiquement.</p>}</section> : <section className="projection-content"><span>{state.theme || "Étude biblique"}</span><h1>{state.title}</h1>{state.mode === "quiz" && state.question ? <><p className="projection-step">QUIZ · {remaining} s</p><strong>{state.question.prompt}</strong><div className="projection-options">{state.question.options.map((option, index) => <span key={index}>{String.fromCharCode(65 + index)} · {option}</span>)}</div>{state.scoreboard?.length > 0 && <ol className="projection-scoreboard">{state.scoreboard.map((score, index) => <li key={index}>{state.teamMode ? `Équipe ${["rouge", "bleu", "vert", "jaune"][score.team]}` : `Participant ${score.rank}`}<strong>{score.score}</strong></li>)}</ol>}</> : <><p className="projection-step">{state.sections?.length ? `Étape ${(state.currentIndex || 0) + 1} sur ${state.sections.length}` : "Bienvenue"}</p><strong>{state.sections?.[state.currentIndex || 0] || "L’animateur va commencer."}</strong>{state.verse && <small>{state.verse}</small>}</>}</section>}<footer>{guestMode ? "Votre accès concerne uniquement cette session. Aucun compte ni archive n’est accessible." : "Appuyez sur F ou utilisez le bouton pour afficher en plein écran."}</footer></main>;
}
