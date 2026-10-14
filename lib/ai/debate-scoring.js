// Shared by the visible Confidence table and the evaluator.
export const confidenceScoringRows = [
  [8, 'Outstanding simple defense; resolves the objection fully.', 'Complete, convincing defense with strong biblical understanding.', 'Decisive contextual evidence and compelling rebuttals.', 'Exceptional expert defense against the strongest objections.'],
  [7, 'Very clear reasoning; answers the challenge and a likely objection.', 'Strong biblical reasoning that handles a counter-argument.', 'Precise references, context, and strong rhetorical control.', 'Masterful interpretation, rebuttals, and rhetorical control.'],
  [6, 'Strong explanation with a useful example and a direct answer.', 'Well-supported explanation with a convincing counter-argument.', 'Well-contextualized evidence that resolves a major objection.', 'Rigorous defense that resolves a major expert challenge.'],
  [5, 'Clear, convincing answer that explains why the idea makes sense.', 'Clear biblical support and a strong direct response.', 'Accurate references and a convincing contextual rebuttal.', 'Strong evidence and a precise response under pressure.'],
  [4, 'A sound reason that fully answers the simple objection.', 'Coherent argument that answers the objection with support.', 'Relevant references explained and applied to the objection.', 'A substantial, well-supported response to the central challenge.'],
  [3, 'Clear answer with a good reason.', 'Clear reasoning with a relevant biblical idea.', 'Accurate reference and a relevant counter-argument.', 'Precise reasoning and evidence, with a small remaining gap.'],
  [2, 'Simple, relevant answer with a sound idea.', 'Relevant explanation with a sound reason.', 'Supported response that answers part of the objection.', 'Sound partial response to a demanding objection.'],
  [1, 'Useful clarification or a small improvement.', 'Clarifies the issue or improves the argument.', 'Exposes an ambiguity or improves the interpretation.', 'Detects a trap or corrects misleading framing.'],
  [0, 'Confusion, hesitation, or repeated clarification; no penalty.', 'Honest uncertainty or clarification without new progress.', 'Honest uncertainty or clarification without new progress.', 'Honest uncertainty or clarification without new progress.'],
  [-1, 'One minor factual or reasoning error.', 'One minor factual or reasoning error.', 'A small contextual or logical imprecision.', 'A small but meaningful interpretive imprecision.'],
  [-2, 'An incorrect claim or a clear contradiction.', 'An important claim lacks a sound basis.', 'A necessary reference or justification is missing.', 'A central assertion lacks necessary precise evidence.'],
  [-3, 'An important error weakens the main reason.', 'A significant error weakens the argument.', 'A passage is misinterpreted or a counter-argument is missed.', 'Significant counter-evidence is left unanswered.'],
  [-4, 'The main answer rests on an incorrect idea.', 'The main argument rests on a false premise.', 'A major context error undermines the defense.', 'A major interpretive or logical error undermines the defense.'],
  [-5, 'Several clear errors undermine the answer.', 'Several significant errors undermine the defense.', 'Multiple unsupported claims or serious context errors.', 'Several major failures of evidence or interpretation.'],
  [-6, 'A central false claim is defended after a clear correction.', 'A central error is defended despite a clear correction.', 'Decisive evidence is dismissed without an answer.', 'Decisive counter-evidence is dismissed without a credible rebuttal.'],
  [-7, 'Repeated contradictions after clear explanations and corrections.', 'Repeated central contradictions despite clear corrections.', 'Repeatedly distorts passages or contradicts established evidence.', 'Repeatedly contradicts established evidence or misrepresents sources.'],
  [-8, 'Exceptional: repeated clear falsehoods after patient corrections.', 'Exceptional: persistent central falsehoods after clear corrections.', 'Exceptional: persistent fabrication or fundamental contradictions.', 'Exceptional: fabricated evidence or a fundamentally contradictory defense.'],
].map(([points, ...descriptions]) => ({ points, descriptions }));

const levels = ['Beginner', 'Intermediate', 'Advanced', 'Hostile'];
export function getConfidenceScoringInstruction(difficulty) {
  const index = Math.max(0, levels.indexOf(difficulty));
  return [
    'Score only Confidence, in integer percentage points from -8 to +8. Choose one best-fitting tier; do not add separate penalties together.',
    ...confidenceScoringRows.map(row => `${row.points}: ${row.descriptions[index]}`),
    'Classify the response as argument, clarification, uncertainty, or evasion, using the preceding objection and conversation. A question is not automatically evasion. If there is both a clarification and an argument, assess the substantive argument.',
    'A genuine clarification-only response can never lose points at any level. At Beginner and Intermediate, a useful new clarification earns exactly +1. At Advanced and Hostile, give +1 only if it reveals an ambiguity or misleading framing; otherwise 0. A repeated clarification or honest expression of confusion/uncertainty earns 0 and is never penalized.',
    'At Beginner and Intermediate, never penalize absent exact verse references or rhetoric. Reward accurate ideas in the user’s own words. All positive tiers, including +8, are attainable with age-neutral simple language and no citations. Evaluate only against the selected difficulty.',
    'At Advanced and Hostile, references matter only when the actual claim requires biblical evidence; do not require a citation for a purely logical point.',
    'Reserve -6, -7, and -8 for serious errors persisting after explicit corrections in the supplied history. Never use them for a first mistake, confusion, missing references, or lack of expertise. If earlier correction is not present, the minimum is -5.',
    'Assess reasoning and accuracy rather than agreement with the opponent. Honor valid answers and previous concessions; never reward length or jargon. Explain the selected tier with one concrete, short reason in English.',
  ].join('\n');
}

export function normalizeConfidenceChange(evaluation, difficulty) {
  if (evaluation?.responseType === 'clarification') {
    if (evaluation.repeatedClarification === true) return 0;
    return ['Beginner', 'Intermediate'].includes(difficulty) || evaluation.usefulClarification === true ? 1 : 0;
  }
  if (evaluation?.responseType === 'uncertainty') return 0;
  const value = Number(evaluation?.change);
  const change = Number.isFinite(value) ? Math.max(-8, Math.min(8, Math.round(value))) : 0;
  return evaluation?.previouslyCorrected === true ? change : Math.max(-5, change);
}
