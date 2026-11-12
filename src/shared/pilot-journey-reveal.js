export const journeyCountdownMs = 3000;
export const journeyRevealMs = 3000;

/** Presentation metadata is separate from the scenario rules. The reply is
 * committed exactly once; the countdown never advances the conversation. */
export function pilotSessionReducer(engine, state, action) {
  if (action.type === 'dismiss-journey') {
    if (!state.journeyReveal) return state;
    const { journeyReveal, ...next } = state;
    return next;
  }
  const updated = engine.pilotReducer(state, action);
  if (updated === state) return state;
  const { journeyReveal, ...next } = updated;
  if (action.type === 'confirm' && next.history.length === state.history.length + 1 && Number.isFinite(action.startedAt) && action.startedAt >= 0) {
    const last = next.history.at(-1);
    next.journeyReveal = { version: 1, startedAt: action.startedAt, scenarioId: next.scenarioId, historyLength: next.history.length, nodeId: last.nodeId, choiceId: last.choiceId };
  }
  return next;
}

/** Reloads and projection tabs share the original timestamp, never a new count. */
export function normalizeJourneyReveal(value, state, now = Date.now()) {
  const last = state?.history?.at(-1);
  if (!value || value.version !== 1 || state?.phase !== 'reaction' || !last
    || !Number.isFinite(value.startedAt) || value.startedAt < 0 || value.startedAt > now
    || now - value.startedAt >= journeyCountdownMs + journeyRevealMs
    || value.scenarioId !== state.scenarioId || value.historyLength !== state.history.length
    || value.nodeId !== last.nodeId || value.choiceId !== last.choiceId) return null;
  return { version: 1, startedAt: value.startedAt, scenarioId: value.scenarioId, historyLength: value.historyLength, nodeId: value.nodeId, choiceId: value.choiceId };
}

export function journeyRevealFrame(state, now = Date.now()) {
  const reveal = normalizeJourneyReveal(state?.journeyReveal, state, now);
  if (!reveal) return null;
  const elapsed = now - reveal.startedAt;
  return { revealed: elapsed >= journeyCountdownMs, countdown: Math.max(0, Math.ceil((journeyCountdownMs - elapsed) / 1000)),
    remainingMs: journeyCountdownMs + journeyRevealMs - elapsed, startedAt: reveal.startedAt };
}
