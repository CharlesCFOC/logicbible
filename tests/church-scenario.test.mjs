import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { churchDefaultSettings, compileChurchScenario, normalizeChurchSettings, restoreChurchScenario, assertChurchDialogue } from '../src/shared/church-scenario.js';
import { pilotReactionContent, groupPilotConversation } from '../src/shared/pilot-dialogue.js';
import { createPilotEngine } from '../src/shared/evangelism-pilot.js';
import { pilotMountainBranches } from '../src/shared/pilot-mountain.js';
import { validateRefugeScenario } from '../src/shared/discussion-refuges.js';
import { generateChurchScenario } from '../lib/ai/church-scenario.js';
import { requestChurchScenario } from '../src/react/pilot-ai.js';
import { authenticatedAiRoutes } from '../lib/ai/access.js';
import { makeChurchScenario } from './fixtures/church-scenario.mjs';

const settings = { ...churchDefaultSettings, topic: 'Le pardon après une trahison', language: 'fr' };
const scenario = () => compileChurchScenario(makeChurchScenario(), settings, 'church-test');
const choose = (engine, state, id) => engine.pilotReducer(engine.pilotReducer(state, { type: 'select', id }), { type: 'confirm' });

test('direct speech and stage directions stay separate through saving and conversation history', () => {
  const raw = makeChurchScenario();
  raw.character.name = 'Maya';
  raw.stages[0].choices[0].reaction = 'I am still unsure, but I can tell you what happened last time.';
  raw.stages[0].choices[0].reactionNarration = 'Maya sits down again, still wary.';
  const saved = restoreChurchScenario(compileChurchScenario(raw, settings, 'church-dialogue'));
  assert.equal(saved.nodes['stage-1'].choices[0].reactionNarration, 'Maya sits down again, still wary.');
  assert.equal(assertChurchDialogue(saved), saved);
  const engine = createPilotEngine(saved);
  const state = choose(engine, engine.pilotReducer(engine.newPilotState(), { type: 'start' }), 'A');
  assert.deepEqual(engine.pilotReactionParts(state), { speech: raw.stages[0].choices[0].reaction, narration: raw.stages[0].choices[0].reactionNarration });
  const pending = engine.pilotTranscript(state);
  assert.equal(pending.at(-1).role, 'narrator');
  assert.ok(!pending.some(message => message.text === raw.stages[0].choices[0].reaction), 'dialogue is withheld until Continue');
  const transcript = engine.pilotTranscript(engine.pilotReducer(state, { type: 'advance' })).slice(0, -1);
  assert.equal(transcript.at(-2).role, 'narrator');assert.equal(transcript.at(-2).text, raw.stages[0].choices[0].reactionNarration);
  assert.equal(transcript.at(-1).role, 'marc');assert.equal(transcript.at(-1).text, raw.stages[0].choices[0].reaction);
});

test('older narrated reactions remain readable as narration and are never attributed as character speech', () => {
  const raw = makeChurchScenario();raw.character.name = 'Maya';
  raw.stages[0].choices[0].reaction = 'Maya remains wary but sits down again and offers one specific example of a conversation that became painful.';
  const saved = restoreChurchScenario(compileChurchScenario(raw, settings, 'church-old-narration'));
  const engine = createPilotEngine(saved);
  const state = choose(engine, engine.pilotReducer(engine.newPilotState(), { type: 'start' }), 'A');
  assert.deepEqual(engine.pilotReactionParts(state), { speech: '', narration: raw.stages[0].choices[0].reaction });
  assert.equal(engine.pilotTranscript(state).at(-1).role, 'narrator');
  assert.throws(() => assertChurchDialogue(saved), /spoken dialogue/);
  assert.equal(pilotReactionContent('Thank you for listening.', 'Maya').speech, 'Thank you for listening.');
  assert.equal(pilotReactionContent('Dr. Maya sits down.', 'Dr. Maya').speech, '');
});

test('new generation rejects a narrated reaction instead of putting it in a speech bubble', async () => {
  const raw = makeChurchScenario();raw.stages[0].choices[0].reaction = 'Camille remains wary and sits down again.';
  await assert.rejects(generateChurchScenario(settings, async options => {
    assert.match(options.instructions, /direct first-person dialogue/);
    assert.match(options.instructions, /reactionNarration/);
    return { text: JSON.stringify(raw) };
  }), { status: 502 });
});

test('confirmation shows the commentator, then Continue appends the character point with the next four replies', () => {
  const raw = makeChurchScenario();
  raw.stages[0].choices[1].reaction = 'Thank you. I feel ready to explain what happened.';
  raw.stages[0].choices[1].reactionNarration = 'Camille takes a breath before continuing.';
  const engine = createPilotEngine(compileChurchScenario(raw, settings, 'church-staged-conversation'));
  const initial = engine.pilotReducer(engine.newPilotState(), { type: 'start' });
  const confirmed = choose(engine, initial, 'B');
  const pending = engine.pilotTranscript(confirmed);
  assert.equal(pending.at(-2).role, 'us');assert.equal(pending.at(-1).role, 'narrator');
  assert.ok(!pending.some(message => message.text === raw.stages[0].choices[1].reaction));
  assert.deepEqual(engine.pilotTranscript(engine.normalizePilotState(confirmed)), pending);
  const continued = engine.pilotReducer(confirmed, { type: 'advance' });
  const transcript = engine.pilotTranscript(continued);
  assert.deepEqual(transcript.slice(0, pending.length), pending, 'previous messages stay in the conversation');
  const grouped = groupPilotConversation(transcript);
  assert.equal(grouped.at(-1).role, 'marc');
  assert.equal(grouped.at(-1).text, `${raw.stages[0].choices[1].reaction}\n\n${raw.stages[1].line}`);
  assert.equal(engine.pilotNode(continued).choices.length, 4);
  assert.deepEqual(engine.normalizePilotState(continued), continued);
});

test('chat grouping leaves original transcript entries intact and keeps commentary separate', () => {
  const transcript = [Object.freeze({ id: 'a', role: 'marc', text: 'Thank you.' }), Object.freeze({ id: 'b', role: 'marc', text: 'What about tomorrow?' }), Object.freeze({ id: 'c', role: 'narrator', text: 'A pause.' })];
  const grouped = groupPilotConversation(transcript);
  assert.equal(grouped.length, 2);assert.equal(grouped[0].text, 'Thank you.\n\nWhat about tomorrow?');
  assert.equal(transcript[0].text, 'Thank you.');assert.equal(grouped[1].role, 'narrator');
});

test('new church games default to English while French remains available', () => {
  assert.equal(churchDefaultSettings.language, 'en');
  assert.equal(normalizeChurchSettings({ ...churchDefaultSettings, topic: 'Forgiveness' }).language, 'en');
  assert.equal(normalizeChurchSettings(settings).language, 'fr');
});

test('settings reject missing topics, excessive input, unsupported levels and unknown Christian values', () => {
  for (const patch of [{ topic: '' }, { topic: 'x'.repeat(1201) }, { objective: 'x'.repeat(1201) }, { objective: [] }, { values: [] }, { values: ['unknown'] }, { difficulty: 'Hostile' }, { duration: 99 }, { language: 'unknown' }, { audience: 'unknown' }]) assert.throws(() => normalizeChurchSettings({ ...settings, ...patch }));
  assert.equal(normalizeChurchSettings({ ...settings, topic: '  Le pardon  ' }).topic, 'Le pardon');
});

test('discussion objectives are optional for old setups and survive scenario persistence', () => {
  const { objective: _objective, ...legacy } = settings;
  assert.equal(normalizeChurchSettings(legacy).objective, '');
  const input = { ...settings, objective: '  Help the group listen with compassion before offering advice.  ' };
  const result = compileChurchScenario(makeChurchScenario(), input, 'church-objective');
  const restored = restoreChurchScenario(JSON.parse(JSON.stringify(result)));
  assert.equal(restored.settings.objective, input.objective.trim());
});

test('compiler rejects incomplete AI output, duplicates, invalid evaluations and values outside the request', () => {
  for (const mutate of [raw => raw.stages.pop(), raw => raw.stages[0].choices.pop(), raw => { raw.stages[0].choices[0].id = 'E'; }, raw => { raw.stages[0].choices[0].review = ''; }, raw => { raw.stages[0].choices[0].value = 'winning'; }, raw => { raw.stages[0].choices.forEach(choice => { choice.quality = 'risky'; }); }, raw => { raw.stages[0].choices[0].text = raw.stages[0].choices[1].text; }, raw => { raw.stages[0].repair = null; }]) {
    const raw = makeChurchScenario(); mutate(raw); assert.throws(() => compileChurchScenario(raw, settings, 'church-test'));
  }
  const result = scenario();
  assert.deepEqual(validateRefugeScenario(result), []);
  assert.deepEqual(restoreChurchScenario(JSON.parse(JSON.stringify(result))), result);
});

test('every generated choice has a repair or valid next stage and reaches the ending without old pilot dialogue', () => {
  const result = scenario(); const engine = createPilotEngine(result);
  for (const [nodeId, node] of Object.entries(result.nodes)) {
    for (const choice of node.choices) {
      const state = { ...engine.newPilotState(), nodeId, phase: 'decision' };
      const reaction = choose(engine, state, choice.id);
      assert.equal(engine.pilotSpokenReaction(reaction), choice.reaction);
      assert.equal(engine.pilotNextNode(reaction), choice.next === 'summit' ? 'stage-1' : choice.next, 'final objective cannot skip earlier stages');
    }
  }
  let state = engine.pilotReducer(engine.newPilotState(), { type: 'start' });
  for (let i = 0; i < 4; i++) {
    const risky = engine.pilotNode(state).choices.find(choice => choice.quality === 'risky');
    state = engine.pilotReducer(choose(engine, state, risky.id), { type: 'advance' });
    assert.match(state.nodeId, /-repair$/);
    const solid = engine.pilotNode(state).choices.find(choice => choice.quality === 'solid');
    state = engine.pilotReducer(choose(engine, state, solid.id), { type: 'advance' });
  }
  assert.equal(state.phase, 'complete');
  assert.deepEqual(engine.pilotRefuges(state).completed, [1, 2, 3, 4]);
  assert.equal(engine.pilotTrail(state).atSummit, true);
  assert.deepEqual(engine.normalizePilotState(state), state);
  assert.equal(engine.pilotReducer(state, { type: 'restart' }).scenarioId, result.id);
  assert.ok(!engine.pilotTranscript(state).some(entry => /Marc|earthquake/.test(entry.text)));
});

test('two custom scenarios keep independent histories, maps, reloads and undo', () => {
  const first = createPilotEngine(scenario());
  const second = createPilotEngine(compileChurchScenario(makeChurchScenario('Dire la vérité au travail'), { ...settings, topic: 'Dire la vérité au travail' }, 'church-second'));
  let state = first.pilotReducer(first.newPilotState(), { type: 'start' });
  state = choose(first, state, first.pilotNode(state).choices.find(choice => choice.quality === 'solid').id);
  assert.equal(first.normalizePilotState(state).phase, 'reaction');
  assert.deepEqual(second.normalizePilotState(state), second.newPilotState());
  const map = pilotMountainBranches(state, 'session-test', first);
  assert.ok(map.edges.length > 0);
  assert.ok(map.nodes.some(node => node.id === 'summit'));
  const undone = first.pilotReducer(state, { type: 'undo' });
  assert.equal(undone.history.length, 0);
  assert.equal(undone.nodeId, 'stage-1');
});

test('server generation requests Christian teaching, requested settings and structured complete output', async () => {
  let call;
  const input = { ...settings, objective: 'Learn to listen with compassion before giving advice.' };
  const result = await generateChurchScenario(input, async options => { call = options; return { text: JSON.stringify(makeChurchScenario()) }; });
  assert.match(call.instructions, /love of neighbor/);
  assert.match(call.instructions, /Never invent Scripture/);
  assert.match(call.instructions, /French/);
  assert.equal(call.jsonMode, true);
  assert.match(call.input, /json/i, 'the Responses JSON mode requires JSON in the input itself');
  assert.equal(JSON.parse(call.input).topic, settings.topic);
  assert.equal(JSON.parse(call.input).objective, input.objective);
  assert.match(call.instructions, /facilitator’s desired learning outcome/);
  assert.equal(result.scenario.settings.objective, input.objective);
  assert.ok(result.scenario.generated);
  await assert.rejects(generateChurchScenario(settings, async () => ({ incomplete: true, text: '{}' })), { status: 502 });
  await assert.rejects(generateChurchScenario(settings, async () => ({ text: '{"stages":[]}' })), { status: 502 });
});

test('generation transport requires sign-in and sends settings and abort signal to the protected endpoint', async () => {
  const input = { ...settings, objective: 'Practice listening with compassion.' };
  const requests = [];
  const fetcher = async (url, options) => { requests.push({ url, options }); return Response.json(url.endsWith('config') ? { configured: true, url: 'https://example.supabase.co', anonKey: 'public-test' } : { scenario: scenario() }); };
  const createAuthClient = token => () => ({ auth: { getSession: async () => ({ data: { session: token ? { access_token: token } : null } }) } });
  await assert.rejects(requestChurchScenario(input, { fetcher, createAuthClient: createAuthClient(null) }), { status: 401 });
  assert.equal(requests.length, 1);
  requests.length = 0;
  const signal = new AbortController().signal;
  const result = await requestChurchScenario(input, { fetcher, signal, createAuthClient: createAuthClient('test-token') });
  assert.equal(requests[1].url, '/api/ai/church-scenario');
  assert.equal(requests[1].options.headers.Authorization, 'Bearer test-token');
  assert.equal(requests[1].options.signal, signal);
  assert.deepEqual(JSON.parse(requests[1].options.body), input);
  assert.equal(result.id, 'church-test');
  assert.ok(authenticatedAiRoutes.has('/api/ai/church-scenario'));
});

test('HTTP entry point rejects unsigned AI generation before external calls', async () => {
  process.env.VERCEL = '1';
  const { default: handler } = await import('../server.mjs');
  const req = Readable.from([JSON.stringify(settings)]);
  Object.assign(req, { url: '/api/ai/church-scenario', method: 'POST', headers: { host: 'localhost' }, socket: { remoteAddress: '127.0.0.1' } });
  const res = { setHeader() {}, writeHead(status) { this.status = status; }, end(body) { this.body = body; } };
  await handler(req, res);
  assert.equal(res.status, 401);
});
