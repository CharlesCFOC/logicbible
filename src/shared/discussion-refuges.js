// Topic-independent objectives. A scenario supplies entry scenes and authored
// choices with `completesRefuge`; emotional scores never unlock an objective.
export const discussionRefuges = [
  { id: 1, name: "Listen", objective: "Understand the real question and acknowledge the emotion." },
  { id: 2, name: "Connect", objective: "Respond with empathy to what the person is experiencing." },
  { id: 3, name: "Clarify", objective: "Explain your belief in accessible words." },
  { id: 4, name: "Offer a next step", objective: "Offer a freely chosen next step without pressure." },
];

export function refugeProgress(scenario, history) {
  const earned = new Set();
  for (const entry of history) {
    const choice = scenario.nodes[entry.nodeId]?.choices.find(item => item.id === entry.choiceId);
    const objective = choice?.completesRefuge;
    if (objective && scenario.refuges.filter(refuge => refuge.id < objective).every(refuge => earned.has(refuge.id))) earned.add(objective);
  }
  const completed = scenario.refuges.filter(refuge => earned.has(refuge.id)).map(refuge => refuge.id);
  const active = scenario.refuges.find(refuge => !earned.has(refuge.id)) || scenario.refuges.at(-1);
  let setbacks = 0;
  for (const entry of [...history].reverse()) {
    const node = scenario.nodes[entry.nodeId];
    const choice = node?.choices.find(item => item.id === entry.choiceId);
    if (node?.stage !== active.id || choice?.quality === "solid") break;
    setbacks++;
  }
  const finished = completed.length === scenario.refuges.length;
  return { completed, active, finished, pauseSuggested: !finished && setbacks >= (scenario.pauseAfterSetbacks || 3) };
}

export function refugeNextScene(scenario, entry, history) {
  const choice = scenario.nodes[entry.nodeId]?.choices.find(item => item.id === entry.choiceId);
  if (!choice) return null;
  if (choice.next !== scenario.completionNode) return choice.next;
  const progress = refugeProgress(scenario, history);
  return progress.finished ? scenario.completionNode : progress.active.entry;
}

export function validateRefugeScenario(scenario) {
  const errors = [];
  if (scenario.refuges?.length !== 4 || scenario.refuges.some((refuge, index) => refuge.id !== index + 1)) errors.push("Four ordered refuges are required.");
  for (const refuge of scenario.refuges || []) {
    if (scenario.nodes[refuge.entry]?.stage !== refuge.id) errors.push(`Invalid entry for refuge ${refuge.id}.`);
  }
  for (const [id, node] of Object.entries(scenario.nodes)) {
    if (!scenario.refuges.some(refuge => refuge.id === node.stage)) errors.push(`Invalid refuge for ${id}.`);
    for (const choice of node.choices) {
      if (choice.next !== scenario.completionNode && !scenario.nodes[choice.next]) errors.push(`Missing target ${id}/${choice.id}.`);
      if (choice.completesRefuge && (choice.completesRefuge !== node.stage || choice.quality !== "solid")) errors.push(`Invalid objective ${id}/${choice.id}.`);
      const advances = choice.next === scenario.completionNode || scenario.nodes[choice.next]?.stage > node.stage;
      if (advances && choice.completesRefuge !== node.stage) errors.push(`Missing objective ${id}/${choice.id}.`);
    }
  }
  return errors;
}
