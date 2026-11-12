import { createPilotEngine, evangelismPilot } from './evangelism-pilot.js';
import { restoreChurchScenario } from './church-scenario.js';
import { pilotMountainBranches } from './pilot-mountain.js';
import { pilotSessionReducer } from './pilot-journey-reveal.js';

export const competitionKind = 'church-team-competition-v1';
export const competitionLifetime = 24 * 60 * 60 * 1000;
export const competitionTeams = [
  { id: 'blue', name: 'Blue team', color: '#67c8ff' },
  { id: 'orange', name: 'Orange team', color: '#ffbc72' },
];
const discussionMode = 'shared-conversation-v1';
export function competitionError(message, status = 409) { return Object.assign(new Error(message), { status }); }
export function competitionScenario(input) {
  if (input?.id === evangelismPilot.id && !input.generated) return evangelismPilot;
  return restoreChurchScenario(input);
}
export function guestName(value) {
  if (typeof value !== 'string') throw competitionError('Enter your guest name.', 400);
  const name = value.trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 32 || /[\p{Cc}\p{Cf}<>]/u.test(name)) throw competitionError('Use a name of 2–32 characters.', 400);
  return name;
}
export function createCompetition(scenario, now = Date.now()) {
  return { kind: competitionKind, mode: discussionMode, revision: 0, scenario, status: 'lobby', round: 0, roundId: null, roundLimit: 8,
    expiresAt: now + competitionLifetime, participants: [], hostTokens: [],
    discussion: createPilotEngine(scenario).newPilotState(), checkpoints: [], sideSlide: 'mountain',
    teams: competitionTeams.map(team => ({ id: team.id, ballot: null })) };
}
// Existing invitation links keep their participants and saved conversation. The
// former blue route becomes the common conversation; original routes are retained
// privately so migrating the presentation never destroys saved history.
export function normalizeCompetition(room) {
  if (room.mode === discussionMode && room.discussion) return room;
  const engine = createPilotEngine(room.scenario);
  room.legacyTeamStates = room.teams.map(team => ({ id: team.id, state: team.state, previous: team.previous }));
  room.discussion = room.teams[0]?.state || engine.newPilotState();
  room.checkpoints = room.discussion.history.map((entry, index) => ({
    discussion: { ...engine.normalizePilotState({ ...room.discussion, phase: 'decision', history: room.discussion.history.slice(0, index), selected: null }), nodeId: entry.nodeId, selected: entry.choiceId, phase: 'decision' },
    round: index + 1, ballots: room.teams.map(() => ({ votes: {} })),
  })).slice(-room.roundLimit);
  room.sideSlide = 'mountain'; room.mode = discussionMode;
  for (const team of room.teams) {
    if (team.state?.nodeId !== room.discussion.nodeId) team.ballot = null;
    const votes = team.ballot?.votes || {};
    team.ballot = room.status === 'lobby' ? null : { votes, eligible: room.participants.filter(p => p.teamId === team.id).map(p => p.id) };
  }
  return room;
}
function openBallots(room) {
  for (const team of room.teams) team.ballot = {
    eligible: room.participants.filter(p => p.teamId === team.id).map(p => p.id), votes: {},
  };
}
function currentDecision(room, roundId) {
  normalizeCompetition(room);
  if (room.status !== 'playing' || room.roundId !== roundId || room.discussion.phase !== 'decision') throw competitionError('The question has changed. Please try again on the current question.');
}
function validChoice(choice) {
  if (!/^[A-D]$/.test(choice || '')) throw competitionError('Choose A, B, C or D.', 400);
}
export function addCompetitionGuest(room, guest, random = Math.random) {
  normalizeCompetition(room);
  if (room.status === 'finished') throw competitionError('This game has finished.');
  if (room.participants.length >= 100) throw competitionError('This session has reached 100 guests.');
  const name = guestName(guest.name);
  if (room.participants.some(p => p.name.toLocaleLowerCase() === name.toLocaleLowerCase())) throw competitionError('This name is already in use. Add an initial or choose another name.');
  const sizes = competitionTeams.map(team => room.participants.filter(p => p.teamId === team.id).length);
  const index = sizes[0] === sizes[1] ? (random() < .5 ? 0 : 1) : sizes[0] < sizes[1] ? 0 : 1;
  const participant = { ...guest, name, teamId: competitionTeams[index].id };
  room.participants.push(participant);
  if (room.status === 'playing' && room.discussion.phase === 'decision') room.teams.find(t => t.id === participant.teamId).ballot.eligible.push(participant.id);
}
export function competitionRoundReady(room) {
  normalizeCompetition(room);
  return room.status === 'playing' && room.discussion.phase === 'reaction';
}
export function startCompetition(room, roundId) {
  normalizeCompetition(room);
  if (room.status !== 'lobby') throw competitionError('The game has already started.');
  const engine = createPilotEngine(room.scenario);
  room.discussion = engine.pilotReducer(room.discussion, { type: 'start' });
  room.status = 'playing'; room.round = 1; room.roundId = roundId; openBallots(room);
}
export function castCompetitionVote(room, participantId, choice, roundId) {
  currentDecision(room, roundId); validChoice(choice);
  const guest = room.participants.find(p => p.id === participantId);
  const ballot = room.teams.find(t => t.id === guest?.teamId)?.ballot;
  if (!ballot?.eligible.includes(participantId)) throw competitionError('Join the session before voting.', 403);
  ballot.votes[participantId] = choice;
  // Votes are suggestions. Only the organizer confirms the common reply.
}
export function selectCompetitionReply(room, choice, roundId) {
  currentDecision(room, roundId); validChoice(choice);
  room.discussion = { ...room.discussion, selected: choice };
}
export function confirmCompetitionReply(room, choice, roundId, startedAt = Date.now()) {
  currentDecision(room, roundId); validChoice(choice);
  if (choice !== room.discussion.selected) throw competitionError('The selected reply has changed. Select your reply again before confirming.');
  room.checkpoints.push({ discussion: structuredClone(room.discussion), round: room.round, ballots: room.teams.map(t => structuredClone(t.ballot)) });
  room.checkpoints = room.checkpoints.slice(-room.roundLimit);
  room.discussion = pilotSessionReducer(createPilotEngine(room.scenario), room.discussion, { type: 'confirm', startedAt });
}
// Older installed bundles can still submit an organizer choice.
export function chooseCompetitionReply(room, _teamId, choice, roundId) {
  selectCompetitionReply(room, choice, roundId); confirmCompetitionReply(room, choice, roundId);
}
export function closeCompetitionBallot(room, _teamId, random = Math.random) {
  currentDecision(room, room.roundId);
  const counts = Object.fromEntries(Array.from('ABCD', id => [id, 0]));
  room.teams.forEach(t => Object.values(t.ballot.votes).forEach(choice => counts[choice]++));
  const high = Math.max(...Object.values(counts));
  if (!high) throw competitionError('Select a reply before confirming.');
  const tied = Object.keys(counts).filter(id => counts[id] === high);
  const choice = tied[Math.min(tied.length - 1, Math.floor(random() * tied.length))];
  chooseCompetitionReply(room, null, choice, room.roundId);
}
export function advanceCompetition(room, roundId, nextRoundId) {
  normalizeCompetition(room);
  if (room.roundId !== roundId || !competitionRoundReady(room)) throw competitionError('Confirm the common reply before continuing.');
  room.discussion = createPilotEngine(room.scenario).pilotReducer(room.discussion, { type: 'advance' });
  if (room.round >= room.roundLimit || room.discussion.phase === 'complete') room.status = 'finished';
  else { room.round++; openBallots(room); }
  room.roundId = nextRoundId;
}
export function undoCompetition(room, roundId, nextRoundId) {
  normalizeCompetition(room);
  if (room.roundId !== roundId) throw competitionError('The question has changed. Please try again.');
  const checkpoint = room.checkpoints.pop();
  if (!checkpoint) throw competitionError('There is no confirmed reply to go back to.');
  room.discussion = checkpoint.discussion; room.round = checkpoint.round; room.roundId = nextRoundId; room.status = 'playing';
  room.teams.forEach((team, index) => {
    team.ballot = { votes: checkpoint.ballots[index]?.votes || {}, eligible: room.participants.filter(p => p.teamId === team.id).map(p => p.id) };
  });
}
export function presentCompetition(room, sideSlide, mountainExpanded) {
  normalizeCompetition(room);
  if (sideSlide !== undefined && !['mountain', 'conversation'].includes(sideSlide)) throw competitionError('Choose the journey or conversation view.', 400);
  if (mountainExpanded !== undefined && typeof mountainExpanded !== 'boolean') throw competitionError('Invalid map view.', 400);
  if (sideSlide !== undefined) room.sideSlide = sideSlide;
  if (mountainExpanded !== undefined) room.mountainExpanded = mountainExpanded;
}
export function manageCompetitionView(room, command, roundId) {
  normalizeCompetition(room);
  if (room.roundId !== roundId) throw competitionError('The question has changed. Please try again.');
  const type = command === 'debrief' ? 'debrief' : command === 'conversation' ? 'close-debrief' : 'dismiss-journey';
  room.discussion = pilotSessionReducer(createPilotEngine(room.scenario), room.discussion, { type });
}
export function competitionScore(engine, state) {
  const shelters = engine.pilotRefuges(state).completed.length;
  const earned = state.history.reduce((sum, entry) => {
    const quality = engine.scenario.nodes[entry.nodeId].choices.find(c => c.id === entry.choiceId).quality;
    return sum + (quality === 'solid' ? 3 : quality === 'mixed' ? 1 : 0);
  }, 0);
  const quality = state.history.length ? Math.round(100 * earned / (3 * state.history.length)) : 0;
  return { shelters, quality, points: shelters * 100 + quality };
}
// Send only the current scene and already-spoken dialogue. Full scenarios,
// future replies and teaching keys never cross the guest boundary.
export function competitionView(id, room, actor) {
  normalizeCompetition(room);
  const preview = { id, title: room.scenario.title, question: room.scenario.question, status: room.status, expiresAt: room.expiresAt };
  if (!actor) return preview;
  const engine = createPilotEngine(room.scenario), state = room.discussion;
  const ready = competitionRoundReady(room), node = engine.pilotNode(state), refuges = engine.pilotRefuges(state);
  const viewer = actor.role === 'host' ? { role: 'host' } : { role: 'guest', id: actor.id, name: actor.name, teamId: actor.teamId };
  const scene = node ? { stage: node.stage, title: node.title, line: node.line, cue: node.cue, choices: node.choices.map(c => ({ id: c.id, text: c.text })) } : null;
  const score = competitionScore(engine, state), trail = engine.pilotTrail(state);
  const history = state.history.map(entry => {
    const question = room.scenario.nodes[entry.nodeId], choice = question.choices.find(c => c.id === entry.choiceId);
    return { title: question.title, choice: choice.id, text: choice.text, review: choice.review, reference: question.reference };
  });
  const teams = room.teams.map(team => {
    const ballot = team.ballot;
    const counts = Object.fromEntries(Array.from('ABCD', choice => [choice, Object.values(ballot?.votes || {}).filter(v => v === choice).length]));
    return { ...competitionTeams.find(t => t.id === team.id), counts, score, trail,
      members: room.participants.filter(p => p.teamId === team.id).map(p => ({ id: p.id, name: p.name, eligible: !!ballot?.eligible.includes(p.id), voted: Object.hasOwn(ballot?.votes || {}, p.id) })),
      done: room.status === 'finished', locked: ready, voted: Object.keys(ballot?.votes || {}).length, expected: ballot?.eligible.length || 0,
      ownVote: ballot?.votes[actor.id] || null, eligible: !!ballot?.eligible.includes(actor.id),
      scene: scene ? { ...scene, choices: scene.choices.map(c => ({ ...c, votes: counts[c.id] })) } : null,
    };
  });
  const pastScenes = {};
  for (const entry of state.history) {
    const past = room.scenario.nodes[entry.nodeId], choice = past.choices.find(c => c.id === entry.choiceId);
    const published = pastScenes[entry.nodeId] ||= { title: past.title, reference: past.reference, repair: !!past.repair, choices: [] };
    if (!published.choices.some(c => c.id === choice.id)) published.choices.push({ id: choice.id, text: choice.text, quality: choice.quality, review: choice.review });
  }
  const before = engine.pilotReducer(state, { type: 'undo' });
  const beforeRefuges = engine.pilotRefuges(before);
  return { ...preview, mode: discussionMode, revision: room.revision, round: room.round, roundId: room.roundId, roundLimit: room.roundLimit,
    ready, viewer, teams, winners: [], canUndo: !!room.checkpoints.length, sideSlide: room.sideSlide,
    character: { name: room.scenario.character.name, initial: room.scenario.character.initial, description: room.scenario.character.description },
    context: room.scenario.context, goal: room.scenario.goal,
    scenario: { id: room.scenario.id, generated: !!room.scenario.generated, duration: room.scenario.duration,
      refuges: room.scenario.refuges.map(r => state.phase === 'complete' || state.returnPhase === 'complete' ? { id: r.id, name: r.name, objective: r.objective } : { id: r.id }),
      summit: state.phase === 'complete' ? room.scenario.summit : null },
    discussion: { scenarioId: state.scenarioId, nodeId: state.nodeId, phase: room.status === 'finished' && state.phase !== 'complete' ? 'debrief' : state.phase,
      returnPhase: state.returnPhase, history: state.history.map(e => ({ nodeId: e.nodeId, choiceId: e.choiceId })), pastScenes,
      selected: state.selected, scene, transcript: engine.pilotTranscript(state), journeyReveal: state.journeyReveal,
      beforeTrail: engine.pilotTrail(before), beforeRefuges: { active: { id: beforeRefuges.active?.id || 4 }, completed: beforeRefuges.completed, finished: beforeRefuges.finished },
      reaction: state.phase === 'complete' ? engine.pilotReactionParts(state) : null,
      mountainExpanded: !!room.mountainExpanded, mountainBranches: room.mountainExpanded ? pilotMountainBranches(state, id, engine) : { nodes: [], edges: [] },
      mood: engine.pilotEmotionalState(state), journey: engine.pilotJourneyState(state.history), trail, score,
      refuges: { active: refuges.active?.id || 4, completed: refuges.completed.length, finished: refuges.finished } },
    review: room.status === 'finished' ? history : [],
  };
}
