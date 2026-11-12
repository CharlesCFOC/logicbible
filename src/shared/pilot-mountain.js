import { pilotRidge, createPilotEngine } from "./evangelism-pilot.js";

function seedNumber(text) {
  let hash = 2166136261;
  for (const character of text) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return hash >>> 0;
}

function shuffled(choices, seed) {
  const result = [...choices];
  let value = seedNumber(seed);
  for (let index = result.length - 1; index > 0; index--) {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    const target = Math.floor(value / 4294967296 * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function decisionState(state, pilotReducer) {
  let current = state.phase === "debrief" ? { ...state, phase: state.returnPhase } : state;
  if (current.phase === "context") current = pilotReducer(current, { type: "start" });
  if (current.phase === "reaction") current = pilotReducer(current, { type: "advance" });
  return current;
}

function signature(state, pilotJourneyState, pilotTrail) {
  if (state.phase === "complete") return "summit";
  const journey = pilotJourneyState(state.history);
  return `${state.nodeId}:${journey.trust}:${journey.frustration}:${journey.distanceBelowRidge}:${pilotTrail(state).current}:${state.history.map(entry => entry.nodeId).join(",")}`;
}

// Show only the next alternatives. Summarize their constructive continuations
// as paths to the summit, revealing further junctions as the group advances.
// Rendering receives no answer letters, evaluations or future dialogue.
export function pilotMountainBranches(state, seed = "mountain", engine) {
  const { pilotNode, pilotReducer, pilotTrail, pilotJourneyState } = engine || createPilotEngine();
  const stateKey = snapshot => signature(snapshot, pilotJourneyState, pilotTrail);
  const current = decisionState(state, pilotReducer);
  if (current.phase === "complete") return { nodes: [], edges: [] };
  const start = { id: "current", point: pilotTrail(state).current, depth: 0, kind: "current" };
  const nodes = new Map([[stateKey(current), start]]);
  const edgeMap = new Map();
  const frontier = new Map();

  const connect = (snapshot, source, choice, depth) => {
    const spoken = pilotReducer(pilotReducer({ ...snapshot, selected: null }, { type: "select", id: choice.id }), { type: "confirm" });
    const next = pilotReducer(spoken, { type: "advance" });
    const key = stateKey(next);
    if (!nodes.has(key)) nodes.set(key, { id: key === "summit" ? "summit" : `node-${nodes.size}-${seedNumber(key).toString(36)}`, point: pilotTrail(spoken).current, depth, kind: key === "summit" ? "summit" : "possible" });
    const target = nodes.get(key);
    target.depth = Math.min(target.depth, depth);
    const id = `${source.id}:${target.id}`;
    if (!edgeMap.has(id)) edgeMap.set(id, { id, source: source.id, target: target.id, depth });
    return { snapshot: next, target, key };
  };

  const explore = (snapshot, source, depth) => {
    if (snapshot.phase === "complete") return;
    if (depth > 1) { frontier.set(stateKey(snapshot), { snapshot, target: source }); return; }
    for (const choice of shuffled(pilotNode(snapshot).choices, `${seed}:${stateKey(snapshot)}`)) {
      const next = connect(snapshot, source, choice, depth);
      explore(next.snapshot, next.target, depth + 1);
    }
  };
  explore(current, start, 1);
  for (const branch of frontier.values()) {
    let { snapshot, target } = branch;
    // From any accumulated frustration level, constructive replies restore the
    // relationship in a bounded number of exchanges; bad replies remain playable.
    while (snapshot.phase !== "complete") {
      const choice = pilotNode(snapshot).choices.find(option => option.quality === "solid");
      const spoken = pilotReducer(pilotReducer({ ...snapshot, selected: null }, { type: "select", id: choice.id }), { type: "confirm" });
      snapshot = pilotReducer(spoken, { type: "advance" });
    }
    if (!nodes.has("summit")) nodes.set("summit", { id: "summit", point: [...pilotRidge[4]], depth: 2, kind: "summit" });
    const id = `${target.id}:summit`;
    edgeMap.set(id, { id, source: target.id, target: "summit", depth: 2 });
  }

  const alternatives = [...nodes.entries()].filter(([, node]) => node.kind === "possible")
    .sort(([a], [b]) => seedNumber(`${seed}:${a}`) - seedNumber(`${seed}:${b}`));
  const descending = alternatives.filter(([, node]) => node.point[1] >= start.point[1]);
  const placed = [start.point, ...pilotRidge];
  for (const [key, node] of alternatives) {
    const hash = seedNumber(`${seed}:${key}`);
    const lane = descending.findIndex(([candidate]) => candidate === key);
    // Spread the lower routes across the face rather than stacking them at
    // their almost identical simulation coordinates. Height still conveys descent.
    const origin = lane >= 0
      ? [Math.min(915, start.point[0] + 85 + lane * 105), Math.min(480, start.point[1] + 48 + lane * 48)]
      : [node.point[0] + 28 + hash % 27, node.point[1] - 10];
    let point;
    let attempt = 0;
    do {
      const angle = (hash % 360 + attempt * 137.5) * Math.PI / 180;
      const radius = attempt ? 9 * Math.sqrt(attempt) : 0;
      point = [Math.max(35, Math.min(950, origin[0] + Math.cos(angle) * radius)), Math.max(58, Math.min(490, origin[1] + Math.sin(angle) * radius))];
      attempt++;
    } while (attempt < 1200 && placed.some(other => Math.hypot(other[0] - point[0], other[1] - point[1]) < 48));
    node.point = point;
    placed.push(point);
  }
  const byId = new Map([...nodes.values()].map(node => [node.id, node]));
  return {
    nodes: [...nodes.values()],
    edges: [...edgeMap.values()].map(edge => ({ ...edge, from: byId.get(edge.source).point, to: byId.get(edge.target).point })),
  };
}

// Distant continuations sweep across separate flanks before meeting the summit.
// Intermediate bends are scenery, not additional scenario nodes.
export function pilotMountainCurve(edge) {
  const { from, to } = edge;
  const hash = seedNumber(edge.id);
  if (edge.depth === 1) {
    const reach = (to[0] - from[0]) * (.25 + hash % 25 / 100);
    return `M${from} C${from[0] + reach},${from[1]} ${to[0] - reach},${to[1]} ${to}`;
  }
  const mid = [from[0] + (to[0] - from[0]) * (.48 + hash % 20 / 100), Math.min(485, from[1] * .76 + to[1] * .24 + 35 + hash % 55)];
  return `M${from} C${from[0] + (mid[0] - from[0]) * .55},${from[1]} ${mid[0] - 35},${mid[1]} ${mid} C${mid[0] + 60},${mid[1]} ${to[0] - 45},${to[1] + 85} ${to}`;
}
