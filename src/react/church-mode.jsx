import React, { useEffect, useRef, useState } from 'react';
import { debateThemes } from '../../lib/ai/debate-topics.js';
import { churchDefaultSettings, churchDifficulties, churchDifficultyLabels, churchPersonalities, churchPersonalityLabels, churchValues, normalizeChurchSettings, restoreChurchScenario } from '../shared/church-scenario.js';
import { createPilotEngine, evangelismPilot } from '../shared/evangelism-pilot.js';
import { EvangelismPilotPage, storagePrefix } from './evangelism-pilot.jsx';
import { useDictation } from './use-dictation.js';
import { DictationControls } from './dictation-controls.jsx';
import { ReadAloudButton } from './read-aloud.jsx';
import { ChurchCompetitionPage, CompetitionSetup } from './church-competition.jsx';

const draftKey = 'brother.churchSetup.v1';
const lifetime = 8 * 60 * 60 * 1000;
function readDraft() {
  try {
    const saved = JSON.parse(localStorage.getItem(draftKey) || 'null');
    if (saved?.version !== 1) return { settings: churchDefaultSettings, scenario: null };
    const settings = normalizeChurchSettings({ ...saved.settings, language: 'en' });
    const scenario = saved.scenario ? restoreChurchScenario(saved.scenario) : null;
    return { settings, scenario: scenario && JSON.stringify(scenario.settings) === JSON.stringify(settings) ? scenario : null };
  } catch { return { settings: churchDefaultSettings, scenario: null }; }
}
function readSession() {
  const params = new URLSearchParams(location.search);
  const id = params.get('session');
  if (!/^[a-f0-9-]{36}$/i.test(id || '')) return null;
  try {
    const saved = JSON.parse(localStorage.getItem(`${storagePrefix}${id}`) || 'null');
    if (!saved || Date.now() - saved.updatedAt >= lifetime) return null;
    const scenario = saved.scenario ? restoreChurchScenario(saved.scenario) : evangelismPilot;
    if (saved.state?.scenarioId !== scenario.id) return null;
    return scenario;
  } catch { return null; }
}
function usePublicScenario() {
  const [scenario, setScenario] = useState(readSession);
  useEffect(() => {
    const refresh = () => setScenario(readSession());
    const changed = event => { if (!event.key || event.key === `${storagePrefix}${new URLSearchParams(location.search).get('session')}`) refresh(); };
    window.addEventListener('storage', changed);
    window.addEventListener('focus', refresh);
    return () => { window.removeEventListener('storage', changed); window.removeEventListener('focus', refresh); };
  }, []);
  return scenario;
}
function PublicChurchScreen() {
  const scenario = usePublicScenario();
  return scenario ? <EvangelismPilotPage scenario={scenario} /> : <main className="church-setup church-screen-waiting"><h1>Waiting for the game</h1><p>The facilitator needs to start a game on this computer and share its projection link.</p><a href="evangelism-pilot.html">Prepare a game</a></main>;
}
function ScenarioPreview({ scenario, disabled = false }) {
  return <section className="church-scenario-preview" aria-labelledby="church-preview-title">
    <div className="church-section-label">02 · YOUR SCENARIO IS READY</div>
    <h2 id="church-preview-title">{scenario.title}</h2><p className="church-preview-question">{scenario.question}</p><ReadAloudButton text={scenario.question} label="Main question" disabled={disabled} /><p>{scenario.context}</p><ReadAloudButton text={scenario.context} label="Story context" disabled={disabled} />
    <dl className="church-preview-facts"><div><dt>Character</dt><dd>{scenario.character.name} · {scenario.character.description}</dd></div><div><dt>Group mission</dt><dd>{scenario.goal}</dd></div><div><dt>Format</dt><dd>{churchDifficultyLabels[scenario.settings.difficulty] || scenario.settings.difficulty} · {scenario.duration} · 4 stages with repair paths</dd></div></dl>
    <ol className="church-preview-stages">{scenario.refuges.map(refuge => <li key={refuge.id}><span>{refuge.id}</span><div><strong>{refuge.name}</strong><p>{refuge.objective}</p></div></li>)}</ol>
    <div className="church-value-tags">{churchValues.filter(value => scenario.settings.values.includes(value.id)).map(value => <span key={value.id}>{value.label}</span>)}</div>
    <details className="church-preview-review"><summary>Review the scenes and teaching before the game</summary>{Object.values(scenario.nodes).map(node => <article key={`${node.stage}-${node.repair}`}><h3>{node.stage} · {node.title}{node.repair ? ' · Repair scene' : ''}</h3><p>{node.line}</p><ReadAloudButton text={[node.line, ...node.choices.map(choice => `${choice.id}. ${choice.text}`)].join(' ')} label={`${node.title}: question and responses`} disabled={disabled} /><ul>{node.choices.map(choice => <li key={choice.id}><strong>{choice.id} · {choice.text}</strong>{choice.reactionNarration && <p className="church-review-note">Narration: {choice.reactionNarration}</p>}<p>{choice.reaction}</p><p className="church-review-note">{choice.review}</p></li>)}</ul><small>Bible reference: {node.reference}</small></article>)}</details>
  </section>;
}

export function ChurchModePage() {
  const params = new URLSearchParams(location.search);
  if (params.get('room')) return <ChurchCompetitionPage roomId={params.get('room')} adminMode={params.get('admin') === '1'} />;
  if (params.get('screen') === '1') return <PublicChurchScreen />;
  if (params.get('legacy') === '1') return <EvangelismPilotPage />;
  return <ChurchPreparation />;
}

function ChurchPreparation() {
  const [draft] = useState(readDraft);
  const [settings, setSettings] = useState(draft.settings);
  const [questionPickerOpen, setQuestionPickerOpen] = useState(false);
  const [religionId, setReligionId] = useState(() => debateThemes.find(theme => theme.questions.includes(draft.settings.topic))?.id || '');
  const [scenario, setScenario] = useState(draft.scenario);
  const [playing, setPlaying] = useState(() => new URLSearchParams(location.search).get('play') === '1' ? readSession() : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [moduleReloadNeeded, setModuleReloadNeeded] = useState(false);
  const [storageNotice, setStorageNotice] = useState('');
  const controller = useRef(null);
  const preview = useRef(null);
  const religion = debateThemes.find(theme => theme.id === religionId);
  const existingQuestion = religion?.questions.includes(settings.topic) ? settings.topic : '';
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    try { localStorage.setItem(draftKey, JSON.stringify({ version: 1, settings, scenario })); setStorageNotice(''); }
    catch { setStorageNotice('Your browser cannot save this setup. Keep this page open.'); }
  }, [settings, scenario]);
  function update(key, value) { setSettings(current => ({ ...current, [key]: value })); setScenario(null); setError(''); }
  const dictation = useDictation({ values: { topic: settings.topic, context: settings.context, objective: settings.objective }, onChange: update });
  async function generate(event) {
    event.preventDefault();
    if (controller.current || dictation.active) return;
    let input;
    try { input = normalizeChurchSettings(settings); } catch (err) { setError(err.message); return; }
    const request = new AbortController(); controller.current = request;
    setBusy(true); setError(''); setModuleReloadNeeded(false); setScenario(null);
    const timeout = window.setTimeout(() => request.abort(), 100000);
    try {
      const { requestChurchScenario } = await import('./pilot-ai.js');
      const generated = await requestChurchScenario(input, { signal: request.signal });
      if (request.signal.aborted) return;
      setScenario(generated);
      requestAnimationFrame(() => preview.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch (err) {
      const staleModule = /dynamically imported module|Importing a module script failed|error loading a dynamically imported module/i.test(err.message || '');
      setModuleReloadNeeded(staleModule);
      setError(staleModule ? 'This form has been updated since you opened it. Reload it to create your scenario. Your setup has been saved.' : request.signal.aborted ? 'Generation stopped. You can try again.' : err.message);
    }
    finally { clearTimeout(timeout); controller.current = null; setBusy(false); }
  }
  function start() {
    if (!scenario || busy || dictation.active) return;
    const session = crypto.randomUUID();
    const next = new URLSearchParams({ session, play: '1' });
    const engine = createPilotEngine(scenario);
    const state = engine.pilotReducer(engine.newPilotState(), { type: 'start' });
    // A new session never overwrites the scenario or history of a previous game.
    try { localStorage.setItem(`${storagePrefix}${session}`, JSON.stringify({ updatedAt: Date.now(), scenario, state })); }
    catch { setError('Local storage is needed to open the game and its projection. Free up space in this browser and try again.'); return; }
    history.replaceState(null, '', `${location.pathname}?${next}`);
    setPlaying(scenario);
    window.scrollTo({ top: 0 });
  }
  function settingsRoom() { history.replaceState(null, '', location.pathname); setPlaying(null); }
  if (playing) return <EvangelismPilotPage scenario={playing} onSettings={settingsRoom} />;
  return <main className="church-setup">
    <nav className="church-setup-nav" aria-label="Navigation"><a href="index.html">← Think room</a><span>CHURCH MODE</span></nav>
    <header className="church-setup-header"><span className="church-section-label">THE PREPARATION ROOM</span><h1>One topic. One conversation.<br /><em>Values to put into practice.</em></h1><p>Prepare a game for your group. AI creates the characters, choices and consequences around your chosen topic.</p></header>
    <div className="church-setup-layout"><form className="church-setup-form" onSubmit={generate} aria-busy={busy}>
      <fieldset disabled={busy}><legend>01 · Prepare the discussion</legend>
        <label htmlFor="church-topic">Your topic or question <span aria-hidden="true">*</span></label><DictationControls field="topic" fieldId="church-topic" label="Your topic or question" dictation={dictation} disabled={busy}><textarea id="church-topic" required maxLength={1200} rows={3} value={settings.topic} onChange={event => dictation.edit('topic', event.target.value)} placeholder="E.g. How can we forgive someone who betrayed us?" aria-describedby="church-topic-hint church-topic-dictation-status" /></DictationControls><small id="church-topic-hint">A Bible topic, an objection or an everyday situation.</small>
        <button className="church-question-toggle" type="button" aria-expanded={questionPickerOpen} aria-controls="church-question-picker" onClick={() => setQuestionPickerOpen(open => !open)}>Choose an existing question <span aria-hidden="true">{questionPickerOpen ? '−' : '+'}</span></button>
        <div className="church-question-picker" id="church-question-picker" hidden={!questionPickerOpen}>
          <label htmlFor="church-religion">Religion / belief<select id="church-religion" value={religionId} onChange={event => setReligionId(event.target.value)}><option value="">Choose…</option>{debateThemes.map(theme => <option key={theme.id} value={theme.id}>{theme.label}</option>)}</select></label>
          <label htmlFor="church-question">Question<select id="church-question" disabled={!religion} value={existingQuestion} onChange={event => { if (event.target.value) dictation.edit('topic', event.target.value); }}><option value="">{religion ? 'Choose a question…' : 'Choose a religion first'}</option>{religion?.questions.map(question => <option key={question} value={question}>{question}</option>)}</select></label>
        </div>
        <label htmlFor="church-context">Group context <span className="church-optional">optional</span></label><DictationControls field="context" fieldId="church-context" label="Group context" dictation={dictation} disabled={busy}><textarea id="church-context" maxLength={1200} rows={2} value={settings.context} onChange={event => dictation.edit('context', event.target.value)} placeholder="E.g. Young adults, a conflict between friends, learning to listen before responding…" aria-describedby="church-context-dictation-status" /></DictationControls>
        <label htmlFor="church-objective">Discussion objective <span className="church-optional">optional</span></label><DictationControls field="objective" fieldId="church-objective" label="Discussion objective" dictation={dictation} disabled={busy}><textarea id="church-objective" maxLength={1200} rows={2} value={settings.objective} onChange={event => dictation.edit('objective', event.target.value)} placeholder="E.g. Help the group respond with empathy, explain Christian hope clearly and offer a respectful next step." aria-describedby="church-objective-dictation-status" /></DictationControls>
        <div className="church-field-grid"><label>Difficulty<select value={settings.difficulty} onChange={event => update('difficulty', event.target.value)}>{churchDifficulties.map(level => <option key={level} value={level}>{churchDifficultyLabels[level]}</option>)}</select></label><label>Character attitude<select value={settings.personality} onChange={event => update('personality', event.target.value)}>{churchPersonalities.map(tone => <option key={tone} value={tone}>{churchPersonalityLabels[tone]}</option>)}</select></label><label>Target duration<select value={settings.duration} onChange={event => update('duration', Number(event.target.value))}>{[10, 20, 30].map(minutes => <option key={minutes} value={minutes}>{minutes} minutes</option>)}</select></label><label>Audience<select value={settings.audience} onChange={event => update('audience', event.target.value)}><option value="adult">Adults</option><option value="teen">Teens</option></select></label></div>
      </fieldset>
      <fieldset className="church-values" disabled={busy}><legend>Christian values to put into practice</legend><p>These principles guide the choices, reactions and Bible-based debrief.</p><div>{churchValues.map(value => <label key={value.id}><input type="checkbox" checked={settings.values.includes(value.id)} onChange={event => update('values', event.target.checked ? churchValues.filter(item => item.id === value.id || settings.values.includes(item.id)).map(item => item.id) : settings.values.filter(id => id !== value.id))} /><span>{value.label}</span></label>)}</div></fieldset>
      {error && <div className="church-setup-error" role="alert"><p>{error}</p>{moduleReloadNeeded && <button type="button" className="church-secondary" onClick={() => window.location.reload()}>Reload form</button>}{/connect|session|sign.in/i.test(error) && <a href="index.html">Open Think Bible to sign in</a>}</div>}
      <div className="church-generate-actions"><button className="church-primary" type="submit" disabled={busy || dictation.active || !settings.topic.trim() || !settings.values.length}>{busy ? 'Creating your scenario…' : scenario ? 'Generate another version with AI' : 'Create the scenario with AI'}</button>{busy && <button type="button" className="church-secondary" onClick={() => controller.current?.abort()}>Cancel</button>}</div>
      {busy && <div className="church-generation-progress" role="progressbar" aria-label="Creating the scenario" aria-describedby="church-generation-status"><span /></div>}
      <p id="church-generation-status" className="church-generation-hint" role="status">{busy ? 'AI is preparing the stages, replies and consequences. This may take a minute.' : 'Review the generated scenario, then start when your group is ready.'}</p>
    </form><aside className="church-setup-side"><section className="church-how-it-works"><span className="church-section-label">A GAME IN THREE STEPS</span><ol><li><b>1</b><div><strong>Choose your topic</strong><p>Choose your question and the difficulty for your group.</p></div></li><li><b>2</b><div><strong>AI prepares the scenario</strong><p>Practical situations, four replies per scene and Christian teaching.</p></div></li><li><b>3</b><div><strong>Start together</strong><p>Discuss the choices and see how they affect the journey.</p></div></li></ol></section><section className="church-values-note"><span aria-hidden="true">✝</span><h2>Faith expressed through choices</h2><p>Listen with humility, speak the truth in love, forgive and respect others’ freedom. The scenario puts these values into practice in real situations.</p></section><a className="church-demo-link" href="evangelism-pilot.html?legacy=1">Try the existing scenario about suffering →</a></aside></div>
    <div ref={preview}>{scenario && <><ScenarioPreview scenario={scenario} disabled={busy || dictation.active} /><CompetitionSetup key={scenario.id} scenario={scenario} /><div className="church-start-bar"><p>Or lead a discussion together on this device.</p><button type="button" className="church-primary" onClick={start} disabled={busy || dictation.active}>Start game →</button></div></>}</div>
    {!scenario && <div className="church-start-bar is-awaiting"><p>Create your scenario to get ready to play.</p><button type="button" className="church-primary" disabled>Start game</button></div>}
    {storageNotice && <p className="church-setup-error" role="status">{storageNotice}</p>}
  </main>;
}
