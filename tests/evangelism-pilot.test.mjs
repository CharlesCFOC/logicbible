import test from 'node:test';
import assert from 'node:assert/strict';
import { evangelismPilot as scenario, lastPilotChoice, newPilotState, normalizePilotState, pilotNode, pilotReducer, pilotReactionPrompt, pilotSourceQuestion, pilotEmotionalState, pilotTranscript, pilotTrail, pilotRidge, pilotSpokenReaction, pilotNextNode, pilotJourneyState, pilotRefuges } from '../src/shared/evangelism-pilot.js';
import { debateThemes } from '../lib/ai/debate-topics.js';
import { requestPilotReaction } from '../src/react/pilot-ai.js';
import { pilotDialogueSegments } from '../src/shared/pilot-dialogue.js';
import { pilotSceneFamilies, pilotEnrichment } from '../src/shared/pilot-enrichment.js';
import { pilotMountainBranches } from '../src/shared/pilot-mountain.js';

const choose = (state, id) => pilotReducer(pilotReducer(state, { type: 'select', id }), { type: 'confirm' });
const advance = state => pilotReducer(state, { type: 'advance' });
const start = () => pilotReducer(newPilotState(), { type: 'start' });
const legacyRecovery = () => normalizePilotState({ ...newPilotState(), version: 3, phase: 'decision', nodeId: 'restore-listening', history: [
  ['objection', 'C'], ['presence', 'D'], ['gospel', 'B'], ['invitation', 'A'], ['repair-invitation', 'B'], ['freedom-invitation', 'D'],
].map(([nodeId, choiceId]) => ({ nodeId, choiceId })) });


test('the expanded mountain previews actual next steps anonymously, shuffled and stable within a session', () => {
  const state = start();
  const before = JSON.stringify(state);
  const branches = pilotMountainBranches(state, 'session-one');
  assert.ok(branches.nodes.filter(node => node.kind === 'possible').length <= 4, 'only nearby junctions are displayed; distant detours are grouped');
  assert.ok(branches.nodes.some(node => node.id === 'summit'), 'the map includes a connected summit');
  assert.ok(branches.edges.filter(edge => edge.source === 'current').length >= 3, 'equivalent alternatives may share a node');
  const reachesSummit = new Set(['summit']);
  for (let i = 0; i < branches.nodes.length; i++) for (const edge of branches.edges) if (reachesSummit.has(edge.target)) reachesSummit.add(edge.source);
  assert.ok(branches.nodes.every(node => reachesSummit.has(node.id)), 'every displayed node has a continuation to the summit');
  const byId = new Map(branches.nodes.map(node => [node.id, node]));
  for (const edge of branches.edges) { assert.deepEqual(edge.from, byId.get(edge.source).point); assert.deepEqual(edge.to, byId.get(edge.target).point); }
  assert.deepEqual(pilotMountainBranches(state, 'session-one'), branches);
  assert.notDeepEqual(pilotMountainBranches(state, 'session-two'), branches);
  assert.deepEqual(pilotMountainBranches(pilotReducer(state, { type: 'select', id: 'C' }), 'session-one'), branches, 'selection must not identify or move an alternative');
  assert.equal(JSON.stringify(state), before, 'viewing the paths cannot play a reply');
  assert.ok(branches.nodes.every(node => Object.keys(node).sort().join(',') === 'depth,id,kind,point'), 'no choice letters, evaluation or future dialogue in displayed nodes');
  const reaction = choose(state, 'C');
  assert.deepEqual(pilotMountainBranches(reaction, 'session-one'), pilotMountainBranches(advance(reaction), 'session-one'), 'a spoken reply is already part of the trail');
  assert.ok(pilotMountainBranches(advance(choose(state, 'A')), 'session-one').nodes.length > 0, 'repair loops have future branches too');
  let complete = state;
  for (const id of ['C', 'D', 'B', 'D']) complete = advance(choose(complete, id));
  assert.deepEqual(pilotMountainBranches(complete), { nodes: [], edges: [] }, 'do not invent future choices after the final scene');
});

test('opening the mountain preserves the discussion and reloads for the projection', () => {
  const state = pilotReducer(start(), { type: 'select', id: 'C' });
  const open = pilotReducer(state, { type: 'mountain-view', expanded: true });
  assert.equal(open.history, state.history);
  assert.equal(open.selected, 'C');
  assert.equal(open.phase, state.phase);
  assert.deepEqual(normalizePilotState(open), open);
  assert.deepEqual(pilotReducer(open, { type: 'mountain-view', expanded: false }), state);
  const legacy = { ...state }; delete legacy.mountainExpanded;
  assert.equal(normalizePilotState(legacy).mountainExpanded, false);
});

test('dialogue emphasis preserves exact words and negation, with short accents in every prepared line', () => {
  const lines = Object.values(scenario.nodes).flatMap(node => [node.line, ...node.choices.map(choice => choice.reaction)]);
  for (const text of lines) {
    const parts = pilotDialogueSegments(text);
    assert.equal(parts.map(part => part.text).join(''), text);
    assert.ok(parts.some(part => part.emphasis), text);
    assert.ok(parts.filter(part => part.emphasis).length <= 2);
  }
  const aiText = "I don’t feel heard. I feel you’re avoiding it. <img src=x onerror=alert(1)>";
  const parts = pilotDialogueSegments(aiText);
  assert.equal(parts.map(part => part.text).join(''), aiText, 'formatting never rewrites AI text or treats it as HTML');
  assert.equal(parts.find(part => part.emphasis).text, 'I don’t feel heard', 'keep the negation with the emotion');
});

test('the fictional feelings follow only spoken replies, carry across scenes, and recover after a correction', () => {
  let state = start();
  const initial = pilotEmotionalState(state);
  const selected = pilotReducer(state, { type: 'select', id: 'A' });
  assert.deepEqual(pilotEmotionalState(selected), initial, 'an unspoken draft does not predict the person’s reaction');
  state = choose(state, 'A');
  assert.equal(pilotEmotionalState(state).expression, 'hurt');
  const afterHurt = pilotEmotionalState(state);
  state = advance(state);
  assert.deepEqual(pilotEmotionalState(state), afterHurt, 'the person does not reset when a new question appears');
  state = choose(state, 'B');
  assert.equal(pilotEmotionalState(state).expression, 'calm');
  assert.equal(pilotEmotionalState(state).relationship, 'Trust is rebuilding');
  assert.deepEqual(pilotEmotionalState(pilotReducer(state, { type: 'undo' })), afterHurt, 'undo restores the relation as well as the path');
  assert.ok(Object.values(pilotEmotionalState(state)).every(value => typeof value === 'string'), 'no invented psychological percentages');
});

test('the conversation view contains the exact spoken exchange, not unchosen replies or the hidden review', () => {
  let state = start();
  assert.equal(pilotTranscript(state).length, 1);
  assert.equal(pilotTranscript(pilotReducer(state, { type: 'select', id: 'D' })).length, 1);
  state = choose(state, 'C');
  const messages = pilotTranscript(state);
  assert.deepEqual(messages.map(message => message.role), ['marc', 'us', 'narrator']);
  assert.equal(messages[1].text, scenario.nodes.objection.choices[2].text);
  assert.ok(!messages.some(message => message.text === scenario.nodes.objection.choices[2].reaction), 'the character waits for Continue');
  assert.equal(pilotTranscript(advance(state)).at(-2).text, scenario.nodes.objection.choices[2].reaction);
  assert.ok(!messages.some(message => message.text === scenario.nodes.objection.choices[0].text));
  assert.ok(!messages.some(message => message.text === scenario.nodes.objection.choices[2].review));
  assert.equal(pilotTranscript(advance(state)).at(-1).text, scenario.nodes.presence.line);
  const prompt = pilotReactionPrompt(state);
  assert.ok(prompt.includes(pilotEmotionalState(state).feeling));
  assert.ok(prompt.includes('remains free to question'));
});

test('carousel view survives reload without changing the path or revealing a future reaction', () => {
  const state = start();
  const conversation = pilotReducer(state, { type: 'side-slide', slide: 'conversation' });
  assert.equal(conversation.history, state.history);
  assert.equal(conversation.nodeId, state.nodeId);
  assert.deepEqual(normalizePilotState(conversation), conversation);
  assert.equal(pilotReducer(conversation, { type: 'side-slide', slide: 'unknown' }), conversation);
  const reaction = choose(state, 'C');
  assert.equal(reaction.sideSlide, 'mountain', 'validation preserves the map so its rise or descent stays visible');
  assert.equal(choose(conversation, 'C').sideSlide, 'conversation', 'the person view stays visible if chosen by the facilitator');
  const oldSave = { ...reaction }; delete oldSave.sideSlide;
  assert.equal(normalizePilotState(oldSave).sideSlide, 'mountain', 'older saved sessions remain compatible');
});

test('only strong replies follow the ridge; partial and harmful replies actually descend', () => {
  let state = start();
  for (const [index, id] of ['C', 'D', 'B', 'D'].entries()) {
    state = choose(state, id);
    const trail = pilotTrail(state);
    assert.deepEqual(trail.current, pilotRidge[index + 1]);
    assert.equal(trail.segments.at(-1).direction, 'up');
    assert.equal(trail.belowRidge, false);
    state = advance(state);
  }
  assert.equal(pilotTrail(state).atSummit, true);
  for (const id of ['A', 'B', 'D']) {
    const initial = start();
    const draft = pilotReducer(initial, { type: 'select', id });
    assert.deepEqual(pilotTrail(draft).current, pilotTrail(initial).current, 'do not reveal the effect before validation');
    const trail = pilotTrail(choose(initial, id));
    assert.equal(trail.segments.at(-1).direction, 'down', id);
    assert.ok(trail.current[1] > pilotRidge[0][1], 'SVG altitude is lower');
    assert.equal(trail.belowRidge, true);
  }
});

test('frustration accumulates and one correct reply does not erase several harmful ones', () => {
  let state = advance(choose(start(), 'A'));
  state = advance(choose(state, 'A'));
  state = advance(choose(state, 'A'));
  const damaged = state;
  state = choose(state, 'B');
  const mood = pilotEmotionalState(state);
  assert.equal(mood.frustrationLabel, 'High');
  assert.equal(mood.trustLabel, 'Very fragile');
  assert.equal(mood.expression, 'tense');
  assert.match(pilotSpokenReaction(state), /earlier exchanges still leave me tense/);
  assert.deepEqual(pilotRefuges(state).completed, [1], 'the listening objective is met without erasing the emotion');
  assert.deepEqual(pilotTrail(state).current, pilotRidge[1]);
  assert.equal(pilotTrail(state).segments.at(-1).direction, 'up');
  const undone = pilotReducer(state, { type: 'undo' });
  assert.deepEqual(pilotEmotionalState(undone), pilotEmotionalState(damaged));
  assert.deepEqual(pilotTrail(undone), pilotTrail(damaged));
  assert.deepEqual(pilotTrail(normalizePilotState(state)), pilotTrail(state), 'reload reproduces cumulative progress');
});

test('an accepted invitation ends at refuge four without filling the relationship gauge', () => {
  let state = start();
  for (const id of ['A', 'B', 'A', 'A', 'D', 'A', 'A', 'A']) state = advance(choose(state, id));
  assert.equal(state.phase, 'complete');
  assert.equal(state.history.length, 8);
  assert.deepEqual(pilotRefuges(state).completed, [1, 2, 3, 4]);
  assert.equal(pilotRefuges(state).finished, true);
  assert.equal(pilotTrail(state).atSummit, true);
  assert.deepEqual(pilotTrail(state).current, pilotRidge.at(-1));
  assert.ok(pilotJourneyState(state.history).trust < 65, 'the old threshold no longer blocks the ending');
  assert.equal(pilotEmotionalState(state).frustrationLabel, 'Noticeable');
  assert.doesNotMatch(pilotSpokenReaction(state), /Before planning that reading/);
});

test('pilot uses the actual existing Debate question and every branch has four concrete replies and a route to the summit', () => {
  const source = debateThemes.find(theme => theme.id === pilotSourceQuestion.themeId);
  assert.equal(scenario.topicQuestion, source.questions[pilotSourceQuestion.number - 1]);
  for (const [id, node] of Object.entries(scenario.nodes)) {
    assert.deepEqual(node.choices.map(choice => choice.id), ['A', 'B', 'C', 'D'], id);
    assert.equal(new Set(node.choices.map(choice => choice.text)).size, 4);
    for (const choice of node.choices) {
      assert.ok(choice.text.length > 50 && choice.reaction.length > 40 && choice.review.length > 40, `${id}/${choice.id}`);
      assert.ok(choice.next === 'summit' || scenario.nodes[choice.next], `${id}/${choice.id} target`);
    }
    const queue = [id]; const seen = new Set(); let reachesSummit = false;
    while (queue.length) {
      const current = queue.shift(); if (current === 'summit') { reachesSummit = true; break; }
      if (seen.has(current)) continue; seen.add(current);
      queue.push(...scenario.nodes[current].choices.map(choice => choice.next));
    }
    assert.ok(reachesSummit, `${id} offers a way forward`);
  }
});

test('every playable reply has a connected continuation and can recover after further mistakes', () => {
  const queue = [start()];
  // Repeated mistakes reveal additional scenes. Seed those valid histories:
  // coverage by node alone would stop before the history-dependent branches.
  for (const prefix of [[], ['C'], ['C', 'D'], ['C', 'D', 'B']]) {
    let state = start();
    for (const id of prefix) state = advance(choose(state, id));
    for (let i = 0; i < 14 && state.phase !== 'complete'; i++) {
      queue.push(state);
      state = advance(choose(state, pilotNode(state).choices.find(choice => choice.quality === 'risky').id));
    }
  }
  let oldRecovery = legacyRecovery();
  for (let i = 0; i < 14; i++) {
    queue.push(oldRecovery);
    oldRecovery = advance(choose(oldRecovery, pilotNode(oldRecovery).choices.find(choice => choice.quality === 'risky').id));
  }
  const covered = new Set();
  while (queue.length) {
    const state = queue.shift();
    if (covered.has(state.nodeId) || state.phase === 'complete') continue;
    covered.add(state.nodeId);
    for (const choice of pilotNode(state).choices) {
      const reaction = choose(state, choice.id);
      const direction = pilotTrail(reaction).segments.at(-1).direction;
      assert.notEqual(direction, choice.quality === 'solid' ? 'down' : 'up', `${state.nodeId}/${choice.id}`);
      let next = advance(reaction);
      assert.notEqual(next.nodeId, state.nodeId, 'a mistake leads to a different question, not the same menu');
      assert.ok(next.phase === 'complete' || pilotNode(next)?.choices.length === 4);
      queue.push(next);
      for (let count = 0; next.phase !== 'complete' && count < 20; count++) {
        next = advance(choose(next, pilotNode(next).choices.find(item => item.quality === 'solid').id));
      }
      assert.equal(next.phase, 'complete', `${state.nodeId}/${choice.id} must be recoverable`);
      assert.equal(pilotTrail(next).atSummit, true);
      assert.deepEqual(pilotRefuges(next).completed, [1, 2, 3, 4]);
    }
  }
  assert.equal(covered.size, Object.keys(scenario.nodes).length, 'all authored detours are reachable');
});

test('a long difficult conversation still allows recovery, undo, reload and a connected map', () => {
  let state = start();
  for (let i = 0; i < 100; i++) state = advance(choose(state, pilotNode(state).choices.find(choice => choice.quality === 'risky').id));
  assert.equal(state.history.length, 100, 'no arbitrary end at the former 80-reply limit');
  assert.deepEqual(normalizePilotState(state), state);
  const graph = pilotMountainBranches(state, 'long-session');
  const connected = new Set(['summit']);
  for (let i = 0; i < graph.nodes.length; i++) for (const edge of graph.edges) if (connected.has(edge.target)) connected.add(edge.source);
  assert.ok(graph.nodes.every(node => connected.has(node.id)));
  for (let i = 0; state.phase !== 'complete' && i < 20; i++) {
    const before = state;
    const reaction = choose(state, pilotNode(state).choices.find(choice => choice.quality === 'solid').id);
    assert.equal(pilotTrail(reaction).segments.at(-1).direction, 'up');
    assert.deepEqual(pilotTrail(pilotReducer(reaction, { type: 'undo' })), pilotTrail(before));
    state = advance(reaction);
  }
  assert.equal(state.phase, 'complete');
  assert.deepEqual(normalizePilotState(state), state);
});

test('saved v1 routes keep their spoken history and an old unfinished summit continues with recovery', () => {
  const history = [
    ['objection', 'A'], ['repair-objection', 'B'], ['presence', 'A'], ['repair-presence', 'A'],
    ['gospel', 'D'], ['repair-gospel', 'C'], ['invitation', 'A'], ['repair-invitation', 'A'],
  ].map(([nodeId, choiceId]) => ({ nodeId, choiceId }));
  const migrated = normalizePilotState({ ...newPilotState(), version: 1, phase: 'complete', nodeId: 'summit', history });
  assert.equal(migrated.history.length, 8);
  assert.equal(migrated.phase, 'decision');
  assert.equal(migrated.nodeId, 'restore-listening');
  assert.equal(pilotTrail(migrated).atSummit, false);
  assert.deepEqual(normalizePilotState(migrated), migrated);
  const oldLoop = normalizePilotState({ ...newPilotState(), version: 1, phase: 'decision', nodeId: 'repair-objection', history: [{ nodeId: 'objection', choiceId: 'A' }, { nodeId: 'repair-objection', choiceId: 'A' }] });
  assert.equal(oldLoop.history.length, 2);
  assert.equal(oldLoop.nodeId, 'repair-objection');
  const freshReply = advance(choose(oldLoop, 'A'));
  assert.equal(freshReply.nodeId, 'listen-objection', 'new replies follow the new connected routes');
  assert.deepEqual(normalizePilotState(freshReply), freshReply);
});

test('confirm speaks our exact reply, preserves the reaction phase, and prevents a double submission', () => {
  let state = start();
  assert.equal(pilotReducer(state, { type: 'confirm' }), state);
  assert.equal(pilotReducer(state, { type: 'select', id: 'E' }), state);
  state = choose(state, 'C');
  assert.equal(state.phase, 'reaction');
  assert.equal(state.nodeId, 'objection', 'next question is not shown before the reaction');
  assert.equal(lastPilotChoice(state).id, 'C');
  assert.equal(pilotReducer(state, { type: 'confirm' }), state, 'double submit does not add a choice');
  assert.equal(advance(state).nodeId, 'presence');
});

test('both a direct route and a repaired route finish the scenario, and the debrief can be closed', () => {
  for (const ids of [['C', 'D', 'B', 'D'], ['A', 'B', 'A', 'A', 'D', 'A', 'A', 'A']]) {
    let state = start();
    for (const id of ids) state = advance(choose(state, id));
    for (let i = 0; state.phase !== 'complete' && i < 20; i++) state = advance(choose(state, pilotNode(state).choices.find(choice => choice.quality === 'solid').id));
    assert.equal(state.phase, 'complete', ids.join(''));
    assert.equal(pilotTrail(state).atSummit, true);
    if (ids.length === 4) assert.equal(state.history.length, 4);
    else assert.equal(state.history.length, ids.length, 'an accepted invitation ends the repaired path immediately');
    const debrief = pilotReducer(state, { type: 'debrief' });
    assert.equal(debrief.phase, 'debrief');
    assert.equal(pilotReducer(debrief, { type: 'debrief' }), debrief, 'reopening does not corrupt return phase');
    assert.equal(pilotReducer(debrief, { type: 'close-debrief' }).phase, 'complete');
    assert.deepEqual(normalizePilotState(debrief), debrief);
    const undone = pilotReducer(state, { type: 'undo' });
    assert.equal(undone.nodeId, state.history.at(-1).nodeId);
    assert.equal(undone.phase, 'decision');
    assert.equal(undone.history.length, state.history.length - 1);
  }
});

test('reload replays the path and rejects invented nodes, forged outcomes and invalid choices', () => {
  const reaction = choose(start(), 'B');
  assert.deepEqual(normalizePilotState(reaction), reaction);
  const continued = pilotReducer(advance(reaction), { type: 'select', id: 'B' });
  assert.deepEqual(normalizePilotState(continued), continued);
  assert.deepEqual(normalizePilotState({ ...continued, phase: 'complete', nodeId: 'summit' }), newPilotState());
  for (const history of [[{ nodeId: 'unknown', choiceId: 'A' }], [{ nodeId: 'objection', choiceId: 'E' }], [{ nodeId: 'presence', choiceId: 'D' }], [null]]) {
    assert.deepEqual(normalizePilotState({ ...reaction, history }), newPilotState());
  }
  assert.equal(pilotReducer(reaction, { type: 'ai-reaction', nodeId: 'objection', historyLength: 99, text: 'Stale' }), reaction);
  const ai = pilotReducer(reaction, { type: 'ai-reaction', nodeId: 'objection', historyLength: 1, text: 'A rephrased reaction.' });
  assert.equal(normalizePilotState(ai).history[0].aiReaction, 'A rephrased reaction.');
  assert.equal(lastPilotChoice(ai).next, lastPilotChoice(reaction).next, 'AI cannot change the branch');
});

test('AI request is optional, uses existing auth and sends only scenario dialogue without the evaluation', async () => {
  const state = choose(start(), 'C');
  const prompt = pilotReactionPrompt(state);
  assert.ok(prompt.includes(lastPilotChoice(state).text));
  assert.ok(!prompt.includes(lastPilotChoice(state).review));
  let requests = [];
  const config = { url: 'https://example.supabase.co', anonKey: 'public-test', configured: true };
  const fetcher = async (url, options) => { requests.push({ url, options }); return Response.json(url.includes('config') ? config : { text: 'Je comprends la limite que tu reconnais.' }); };
  await assert.rejects(requestPilotReaction(state, { fetcher, createAuthClient: () => ({ auth: { getSession: async () => ({ data: { session: null } }) } }) }), { status: 401 });
  assert.equal(requests.length, 1, 'no AI call without sign-in');
  requests = [];
  const result = await requestPilotReaction(state, { fetcher, createAuthClient: () => ({ auth: { getSession: async () => ({ data: { session: { access_token: 'test-token' } } }) } }) });
  assert.equal(result, 'Je comprends la limite que tu reconnais.');
  assert.equal(requests[1].options.headers.Authorization, 'Bearer test-token');
  assert.equal(JSON.parse(requests[1].options.body).mode, 'chat');
});


test('detours exhaust fresh scenes before revisiting, and keep exact dialogue on reload', () => {
  const prefixes = [[], ['C'], ['C', 'D'], ['C', 'D', 'B']];
  for (let familyIndex = 0; familyIndex < pilotSceneFamilies.length; familyIndex++) {
    let state = familyIndex === 4 ? legacyRecovery() : start();
    for (const id of prefixes[familyIndex] || []) state = advance(choose(state, id));
    const family = pilotSceneFamilies[familyIndex];
    if (!family.includes(state.nodeId)) state = advance(choose(state, pilotNode(state).choices.find(c => c.quality === 'risky').id));
    const questions = new Set();
    for (let i = 0; i < family.length; i++) {
      assert.ok(family.includes(state.nodeId));
      assert.ok(!questions.has(pilotNode(state).line), `${state.nodeId} repeated before exploring the family`);
      questions.add(pilotNode(state).line);
      const before = state;
      const reply = pilotNode(state).choices.find(c => c.quality === 'risky');
      const reaction = choose(state, reply.id);
      assert.deepEqual(pilotTranscript(normalizePilotState(reaction)), pilotTranscript(reaction));
      const undone = pilotReducer(reaction, { type: 'undo' });
      assert.equal(pilotNode(undone).line, pilotNode(before).line);
      state = advance(reaction);
      assert.deepEqual(normalizePilotState(state), state);
    }
  }
  assert.equal(Object.keys(pilotEnrichment).length, 12);
});

test('v2 sessions keep historical questions and gain new detours on their next answers', () => {
  const history = [['objection','A'], ['repair-objection','A'], ['listen-objection','A'], ['repair-objection','A']]
    .map(([nodeId, choiceId]) => ({ nodeId, choiceId }));
  const migrated = normalizePilotState({ ...newPilotState(), version: 2, history, phase: 'decision', nodeId: 'listen-objection' });
  assert.equal(migrated.history.length, 4);
  assert.equal(migrated.nodeId, 'listen-objection');
  assert.ok(migrated.history.every(entry => entry.routeVersion === 2));
  assert.deepEqual(normalizePilotState(migrated), migrated);
  const continued = advance(choose(migrated, 'A'));
  assert.equal(continued.nodeId, 'name-the-harm');
  assert.deepEqual(normalizePilotState(continued), continued);
  assert.equal(pilotTranscript(continued).filter(entry => entry.role === 'us').length, 5);
});


test('refuges are earned on confirmation, survive reload, and undo removes the last achievement', () => {
  let state = start();
  assert.deepEqual(pilotRefuges(state).completed, []);
  assert.equal(pilotRefuges(choose(state, 'A')).active.id, 1);
  const selected = pilotReducer(state, { type: 'select', id: 'C' });
  assert.deepEqual(pilotRefuges(selected).completed, []);
  state = choose(state, 'C');
  assert.deepEqual(pilotRefuges(state).completed, [1]);
  assert.equal(pilotRefuges(state).active.id, 2);
  assert.deepEqual(pilotRefuges(normalizePilotState(state)), pilotRefuges(state));
  assert.deepEqual(pilotRefuges(pilotReducer(state, { type: 'undo' })).completed, []);
});

test('three setbacks offer a pause, without forcing completion or blocking recovery', () => {
  let state = start();
  for (let i = 0; i < 3; i++) state = advance(choose(state, pilotNode(state).choices.find(choice => choice.quality === 'risky').id));
  assert.equal(pilotRefuges(state).pauseSuggested, true);
  assert.equal(state.phase, 'decision');
  const debrief = pilotReducer(state, { type: 'debrief' });
  assert.equal(pilotReducer(debrief, { type: 'close-debrief' }).nodeId, state.nodeId);
  state = advance(choose(state, pilotNode(state).choices.find(choice => choice.quality === 'solid').id));
  assert.equal(pilotRefuges(state).pauseSuggested, false);
  assert.deepEqual(pilotRefuges(state).completed, [1]);
});

test('v3 recovery saves preserve their transcript and use the objective ending for new replies', () => {
  let state = legacyRecovery();
  assert.equal(state.history.length, 6);
  assert.equal(state.nodeId, 'restore-listening');
  assert.ok(state.history.every(entry => entry.routeVersion === 3));
  assert.deepEqual(pilotRefuges(state).completed, [1, 2, 3]);
  assert.deepEqual(normalizePilotState(state), state);
  const spoken = pilotTranscript(state);
  for (let count = 0; state.phase !== 'complete' && count < 4; count++) state = advance(choose(state, pilotNode(state).choices.find(choice => choice.quality === 'solid').id));
  assert.equal(state.phase, 'complete');
  assert.ok(state.history.length <= 9, 'no long threshold refill for old sessions');
  assert.deepEqual(pilotTranscript(state).slice(0, spoken.length).map(({ role, text }) => ({ role, text })), spoken.map(({ role, text }) => ({ role, text })));
  assert.deepEqual(normalizePilotState(state), state);
});


test('English AI reactions survive reload while legacy French overrides fall back to translated dialogue', () => {
  const state = choose(start(), 'C');
  const old = { ...state, history: state.history.map(entry => ({ ...entry, aiReaction: 'Ancienne réaction en français.' })) };
  const restored = normalizePilotState(old);
  assert.equal(restored.history[0].aiReaction, 'Ancienne réaction en français.');
  assert.equal(pilotSpokenReaction(restored), scenario.nodes.objection.choices[2].reaction);
  const english = pilotReducer(restored, { type: 'ai-reaction', nodeId: restored.nodeId, historyLength: 1, text: 'I feel heard. Thank you for listening.' });
  assert.equal(pilotSpokenReaction(normalizePilotState(english)), 'I feel heard. Thank you for listening.');
  assert.match(pilotReactionPrompt(english), /Rephrase only the prepared reaction in English/);
});
