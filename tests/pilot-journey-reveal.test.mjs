import test from 'node:test';
import assert from 'node:assert/strict';
import { createPilotEngine } from '../src/shared/evangelism-pilot.js';
import { journeyCountdownMs, journeyRevealMs, journeyRevealFrame, normalizeJourneyReveal, pilotSessionReducer } from '../src/shared/pilot-journey-reveal.js';

const engine = createPilotEngine();
const startedAt = 10000;
function confirm(quality = 'solid') {
  let state = engine.pilotReducer(engine.newPilotState(), { type: 'start' });
  const choice = engine.pilotNode(state).choices.find(item => item.quality === quality);
  state = pilotSessionReducer(engine, state, { type: 'select', id: choice.id });
  return pilotSessionReducer(engine, state, { type: 'confirm', startedAt });
}

test('confirmation commits one reply and reveals its route only after a three-second countdown', () => {
  const state = confirm();
  assert.equal(state.phase, 'reaction');assert.equal(state.history.length, 1);
  assert.equal(journeyRevealFrame(state, startedAt).countdown, 3);
  assert.equal(journeyRevealFrame(state, startedAt + 1000).countdown, 2);
  assert.equal(journeyRevealFrame(state, startedAt + 2000).countdown, 1);
  assert.equal(journeyRevealFrame(state, startedAt + journeyCountdownMs - 1).revealed, false);
  assert.equal(journeyRevealFrame(state, startedAt + journeyCountdownMs).revealed, true);
  assert.equal(journeyRevealFrame(state, startedAt + journeyCountdownMs + journeyRevealMs), null);
  assert.equal(pilotSessionReducer(engine, state, { type: 'confirm', startedAt: 20000 }), state, 'double clicks do not commit another response or restart the clock');
});

test('the reveal uses actual upward and downward trail segments without changing game rules', () => {
  for (const quality of ['solid', 'risky']) {
    const state = confirm(quality);
    const clean = engine.normalizePilotState(state);
    assert.deepEqual(engine.pilotTrail(state), engine.pilotTrail(clean));
    assert.equal(engine.pilotTrail(state).segments.at(-1).direction, quality === 'solid' ? 'up' : 'down');
    const dismissed = pilotSessionReducer(engine, state, { type: 'dismiss-journey' });
    assert.deepEqual(dismissed, clean);assert.equal(dismissed.phase, 'reaction', 'closing the animation does not advance the conversation');
  }
});

test('reload and projection resume the shared timestamp instead of restarting a countdown', () => {
  const state = confirm();
  const restored = engine.normalizePilotState(JSON.parse(JSON.stringify(state)));
  const reveal = normalizeJourneyReveal(state.journeyReveal, restored, startedAt + 2300);
  assert.equal(reveal.startedAt, startedAt);
  assert.equal(journeyRevealFrame({ ...restored, journeyReveal: reveal }, startedAt + 2300).countdown, 1);
  assert.equal(normalizeJourneyReveal(state.journeyReveal, restored, startedAt + 6000), null);
});

test('stale or mismatched reveals cannot attach to another choice or later scene', () => {
  const state = confirm();
  for (const value of [{ ...state.journeyReveal, choiceId: 'X' }, { ...state.journeyReveal, scenarioId: 'another' }, { ...state.journeyReveal, historyLength: 9 }, { ...state.journeyReveal, startedAt: NaN }, { ...state.journeyReveal, startedAt: 999999 }]) {
    assert.equal(normalizeJourneyReveal(value, state, startedAt + 100), null);
  }
  for (const action of [{ type: 'undo' }, { type: 'restart' }, { type: 'advance' }, { type: 'debrief' }]) {
    assert.equal(pilotSessionReducer(engine, state, action).journeyReveal, undefined);
  }
});
