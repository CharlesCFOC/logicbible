import { pilotReactionContent } from './pilot-dialogue.js';

export const churchValues = [
  { id: 'love', label: 'Love of neighbor' },
  { id: 'truth', label: 'Truth and integrity' },
  { id: 'humility', label: 'Humility and listening' },
  { id: 'forgiveness', label: 'Grace and forgiveness' },
  { id: 'service', label: 'Service and compassion' },
  { id: 'freedom', label: 'Respect for freedom' },
];
export const churchDifficulties = ['Débutant', 'Intermédiaire', 'Avancé'];
export const churchPersonalities = ['Curieux', 'Sceptique', 'Direct'];
export const churchDifficultyLabels = { 'Débutant': 'Beginner', 'Intermédiaire': 'Intermediate', 'Avancé': 'Advanced' };
export const churchPersonalityLabels = { 'Curieux': 'Curious', 'Sceptique': 'Skeptical', 'Direct': 'Direct' };
export const churchDefaultSettings = { topic: '', context: '', objective: '', difficulty: 'Intermédiaire', personality: 'Sceptique', duration: 20, audience: 'adult', language: 'en', values: churchValues.map(value => value.id) };

function invalid(message, status = 400) { return Object.assign(new Error(message), { status }); }
function text(value, name, max, required = true) {
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) throw invalid(`${name} is missing or too long.`);
  return value.trim();
}
export function normalizeChurchSettings(input) {
  if (!input || typeof input !== 'object') throw invalid('Choose a topic and the game settings.');
  const values = Array.isArray(input.values) ? [...new Set(input.values)] : [];
  if (!churchDifficulties.includes(input.difficulty) || !churchPersonalities.includes(input.personality)
    || ![10, 20, 30].includes(input.duration) || !['adult', 'teen'].includes(input.audience)
    || !['fr', 'en'].includes(input.language) || !values.length || values.some(id => !churchValues.some(value => value.id === id))) throw invalid('Check the difficulty, audience and selected values.');
  return { topic: text(input.topic, 'Topic', 1200), context: text(input.context ?? '', 'Context', 1200, false), objective: text(input.objective ?? '', 'Discussion objective', 1200, false), difficulty: input.difficulty,
    personality: input.personality, duration: input.duration, audience: input.audience, language: input.language, values };
}

// The model writes the dialogue. The application owns every transition, so a
// generated reply cannot skip a refuge or create an unreachable ending.
export function compileChurchScenario(raw, settingsInput, id) {
  const settings = normalizeChurchSettings(settingsInput);
  const str = (value, name, max = 900) => text(value, name, max);
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.stages) || raw.stages.length !== 4) throw invalid('The scenario must contain four complete stages.', 502);
  const nodes = {};
  const refuges = [];
  raw.stages.forEach((stage, index) => {
    const number = index + 1;
    const entry = `stage-${number}`;
    refuges.push({ id: number, name: str(stage.title, 'Stage title', 100), objective: str(stage.objective, 'Objective', 400), entry });
    for (const [source, repair] of [[stage, false], [stage.repair, true]]) {
      if (!source || !Array.isArray(source.choices) || source.choices.length !== 4) throw invalid('A scene is incomplete.', 502);
      const choices = source.choices.map((choice, choiceIndex) => {
        if (!choice || choice.id !== 'ABCD'[choiceIndex] || !['solid', 'mixed', 'risky'].includes(choice.quality) || !settings.values.includes(choice.value)) throw invalid('The scenario replies or values are invalid.', 502);
        return { id: choice.id, text: str(choice.text, 'Reply', 500), reaction: str(choice.reaction, 'Reaction', 700), review: str(choice.review, 'Explanation', 900),
          ...(choice.reactionNarration === undefined ? {} : { reactionNarration: text(choice.reactionNarration, 'Reaction narration', 400, false) }),
          quality: choice.quality, value: choice.value,
          next: choice.quality === 'solid' ? (number === 4 ? 'summit' : `stage-${number + 1}`) : `${entry}-repair`,
          ...(choice.quality === 'solid' ? { completesRefuge: number } : {}) };
      });
      if (!['solid', 'mixed', 'risky'].every(quality => choices.some(choice => choice.quality === quality)) || new Set(choices.map(choice => choice.text.toLocaleLowerCase())).size !== 4) throw invalid('The replies must offer distinct choices and their consequences.', 502);
      nodes[`${entry}${repair ? '-repair' : ''}`] = { stage: number, repair, title: str(source.title || stage.title, 'Title', 100),
        cue: str(source.cue, 'Scene context', 500), line: str(source.line, 'Character question', 700), reference: str(source.reference || stage.reference, 'Bible reference', 150), choices };
    }
  });
  const character = raw.character || {};
  const summit = raw.summit || {};
  return { id: str(id, 'Identifier', 100), generated: true, settings, title: str(raw.title, 'Title', 150), question: str(raw.question, 'Question', 300),
    context: str(raw.context, 'Context'), goal: str(raw.goal, 'Mission', 600), opening: nodes['stage-1'].line,
    character: { name: str(character.name, 'Character', 60), initial: str(character.name, 'Character', 60).slice(0, 1), description: str(character.description, 'Profile', 300), detail: str(character.detail, 'Character situation', 400) },
    summit: { name: str(summit.name, 'Ending title', 100), line: str(summit.line, 'Ending', 600), detail: str(summit.detail, 'Debrief', 700) },
    topicId: 'custom', topicQuestion: settings.topic, duration: `${settings.duration} min`, completionNode: 'summit', pauseAfterSetbacks: 3, first: 'stage-1', refuges, nodes };
}

export function assertChurchDialogue(scenario) {
  const lines = [scenario.summit.line, ...Object.values(scenario.nodes).flatMap(node => [node.line, ...node.choices.map(choice => choice.reaction)])];
  if (lines.some(line => !pilotReactionContent(line, scenario.character.name).speech)) {
    throw invalid('The character replies must contain spoken dialogue, not narration.', 502);
  }
  return scenario;
}

// Stored generated scenarios are rebuilt through the same validator as AI output.
export function restoreChurchScenario(saved) {
  if (!saved?.generated) throw invalid('Invalid saved scenario.');
  const stages = [1, 2, 3, 4].map(number => ({ ...saved.nodes?.[`stage-${number}`], objective: saved.refuges?.[number - 1]?.objective,
    repair: saved.nodes?.[`stage-${number}-repair`] }));
  return compileChurchScenario({ ...saved, stages }, saved.settings, saved.id);
}
