import { createPilotEngine, evangelismPilot } from './evangelism-pilot.js';
import { restoreChurchScenario } from './church-scenario.js';

export const competitionKind = 'church-team-competition-v1';
export const competitionLifetime = 24 * 60 * 60 * 1000;
export const competitionTeams = [
  { id: 'blue', name: 'Blue team', color: '#67c8ff' },
  { id: 'orange', name: 'Orange team', color: '#ffbc72' },
];
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
  const engine = createPilotEngine(scenario);
  return { kind: competitionKind, revision: 0, scenario, status: 'lobby', round: 0, roundId: null, roundLimit: 8,
    expiresAt: now + competitionLifetime, participants: [], hostTokens: [],
    teams: competitionTeams.map(team => ({ id: team.id, state: engine.newPilotState(), previous: null, ballot: null })) };
}
export function addCompetitionGuest(room, guest, random = Math.random) {
  if (room.status === 'finished') throw competitionError('This game has finished.');
  if (room.participants.length >= 100) throw competitionError('This session has reached 100 guests.');
  const name = guestName(guest.name);
  if (room.participants.some(p => p.name.toLocaleLowerCase() === name.toLocaleLowerCase())) throw competitionError('This name is already in use. Add an initial or choose another name.');
  const sizes = competitionTeams.map(team => room.participants.filter(p => p.teamId === team.id).length);
  const index = sizes[0] === sizes[1] ? (random() < .5 ? 0 : 1) : sizes[0] < sizes[1] ? 0 : 1;
  room.participants.push({ ...guest, name, teamId: competitionTeams[index].id });
}
export function competitionRoundReady(room) {
  return room.status === 'playing' && room.teams.every(team => team.state.phase === 'complete' || team.ballot?.choice);
}
function openRound(room, roundId) {
  room.round += 1; room.roundId = roundId;
  for (const team of room.teams) {
    team.previous = null;
    team.ballot = team.state.phase === 'complete' ? null : {
      eligible: room.participants.filter(p => p.teamId === team.id).map(p => p.id), votes: {}, choice: null, tied: false,
    };
  }
}
export function startCompetition(room, roundId) {
  if (room.status !== 'lobby') throw competitionError('The game has already started.');
  const engine = createPilotEngine(room.scenario);
  room.teams.forEach(t => { t.state = engine.pilotReducer(t.state, { type: 'start' }); });
  room.status = 'playing'; openRound(room, roundId);
}
function confirmCompetitionChoice(room, team, choice, tied = false) {
  team.ballot.choice = choice; team.ballot.tied = tied;
  const engine = createPilotEngine(room.scenario);
  team.previous = team.state;
  team.state = engine.pilotReducer(engine.pilotReducer(team.state, { type: 'select', id: choice }), { type: 'confirm' });
}
export function chooseCompetitionReply(room, teamId, choice, roundId) {
  if (room.status !== 'playing' || room.roundId !== roundId) throw competitionError('The round has changed. Refresh before choosing.');
  if (!/^[A-D]$/.test(choice || '')) throw competitionError('Choose A, B, C or D.', 400);
  const team = room.teams.find(t => t.id === teamId);
  if (!team?.ballot || team.ballot.choice) throw competitionError('This team’s choice is not open.');
  if (team.ballot.eligible.length) throw competitionError('This team has guests voting. Wait for their replies.');
  confirmCompetitionChoice(room, team, choice);
}
export function closeCompetitionBallot(room, teamId, random = Math.random) {
  const team = room.teams.find(t => t.id === teamId);
  if (room.status !== 'playing' || !team?.ballot || team.ballot.choice) throw competitionError('This vote is not open.');
  const counts = Object.fromEntries(Array.from('ABCD', id => [id, 0]));
  Object.values(team.ballot.votes).forEach(id => { counts[id] += 1; });
  const high = Math.max(...Object.values(counts));
  if (!high) throw competitionError('At least one team member must vote before closing.');
  const tied = Object.keys(counts).filter(id => counts[id] === high);
  const choice = tied[Math.min(tied.length - 1, Math.floor(random() * tied.length))];
  confirmCompetitionChoice(room, team, choice, tied.length > 1);
}
export function castCompetitionVote(room, participantId, choice, roundId, random = Math.random) {
  if (room.status !== 'playing' || room.roundId !== roundId) throw competitionError('The round has changed. Refresh before voting.');
  if (!/^[A-D]$/.test(choice || '')) throw competitionError('Choose A, B, C or D.', 400);
  const guest = room.participants.find(p => p.id === participantId);
  const team = room.teams.find(t => t.id === guest?.teamId);
  const ballot = team?.ballot;
  if (!ballot?.eligible.includes(participantId)) throw competitionError('You can vote from the next round.');
  if (ballot.choice) {
    if (ballot.votes[participantId] === choice) return;
    throw competitionError('Your team’s choice is already confirmed.');
  }
  ballot.votes[participantId] = choice;
  if (ballot.eligible.every(id => Object.hasOwn(ballot.votes, id))) closeCompetitionBallot(room, team.id, random);
}
export function advanceCompetition(room, roundId, nextRoundId) {
  if (room.roundId !== roundId || !competitionRoundReady(room)) throw competitionError('Wait until both teams have confirmed their choices.');
  const engine = createPilotEngine(room.scenario);
  room.teams.forEach(team => { team.state = engine.pilotReducer(team.state, { type: 'advance' }); });
  if (room.round >= room.roundLimit || room.teams.every(t => t.state.phase === 'complete')) room.status = 'finished';
  else openRound(room, nextRoundId);
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
// Only this whitelist crosses the server/browser boundary. No answer keys,
// future scenes, guest credentials or organizer credentials are shared.
export function competitionView(id, room, actor) {
  const preview = { id, title: room.scenario.title, question: room.scenario.question, status: room.status, expiresAt: room.expiresAt };
  if (!actor) return preview;
  const engine = createPilotEngine(room.scenario);
  const ready = competitionRoundReady(room);
  const viewer = actor.role === 'host' ? { role: 'host' } : { role: 'guest', id: actor.id, name: actor.name, teamId: actor.teamId };
  const teams = room.teams.map(team => {
    const ballot = team.ballot;
    const visibleState = !ready && room.status !== 'finished' && team.previous ? team.previous : team.state;
    const node = engine.pilotNode(team.state);
    const resultEntry = team.state.history.at(-1);
    const resultChoice = resultEntry && engine.scenario.nodes[resultEntry.nodeId].choices.find(c => c.id === resultEntry.choiceId);
    const showResult = ready || room.status === 'finished';
    const canSeeBallot = actor.role === 'host' || actor.teamId === team.id || showResult;
    const counts = Object.fromEntries(Array.from('ABCD', choice => [choice, canSeeBallot ? Object.values(ballot?.votes || {}).filter(v => v === choice).length : 0]));
    return { ...competitionTeams.find(t => t.id === team.id), score: competitionScore(engine, visibleState), trail: engine.pilotTrail(visibleState),
      members: room.participants.filter(p => p.teamId === team.id).map(p => ({ id: p.id, name: p.name, eligible: ballot?.eligible.includes(p.id) || false, voted: Object.hasOwn(ballot?.votes || {}, p.id) })),
      done: team.state.phase === 'complete', locked: !!ballot?.choice, voted: Object.keys(ballot?.votes || {}).length, expected: ballot?.eligible.length || 0,
      ownVote: ballot?.votes[actor.id] || null, eligible: !!ballot?.eligible.includes(actor.id),
      scene: node ? { title: node.title, line: node.line, cue: node.cue, choices: node.choices.map(c => ({ id: c.id, text: c.text, votes: counts[c.id] })) } : null,
      result: showResult && resultChoice ? { choice: resultChoice.id, text: resultChoice.text, quality: resultChoice.quality, reaction: resultChoice.reaction, narration: resultChoice.reactionNarration || '', review: resultChoice.review, reference: engine.scenario.nodes[resultEntry.nodeId].reference, tied: !!ballot?.tied } : null,
    };
  });
  const max = Math.max(...teams.map(t => t.score.points));
  const winners = room.status === 'finished' ? teams.filter(t => t.score.points === max).map(t => t.id) : [];
  return { ...preview, revision: room.revision, round: room.round, roundId: room.roundId, roundLimit: room.roundLimit, ready, viewer, teams, winners,
    character: { name: room.scenario.character.name }, context: room.scenario.context, goal: room.scenario.goal,
    review: room.status === 'finished' ? room.teams.map(team => ({ teamId: team.id, entries: team.state.history.map(entry => {
      const node = engine.scenario.nodes[entry.nodeId], choice = node.choices.find(c => c.id === entry.choiceId);
      return { title: node.title, choice: choice.id, text: choice.text, quality: choice.quality, review: choice.review, reference: node.reference };
    }) })) : [],
  };
}
