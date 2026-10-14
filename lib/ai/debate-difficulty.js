export const debateDifficultyDescriptions = {
  Beginner: {
    behavior: "A clear, approachable conversation: 2–3 short sentences, one simple objection, and one focused question.",
    expectations: "Answer in your own words with one simple reason. You do not need Bible references, technical terms, or rhetorical skills.",
    instruction: "Use language a 12-year-old can easily understand. Reply in 2–3 short sentences, at most 55 words. Raise just one simple objection and finish with one easy question. Use everyday words and concrete examples. No jargon, abstract philosophy, rhetorical traps, stacked questions, or lists of arguments. Do not demand Bible quotations, chapter-and-verse references, or historical knowledge. Accept a sound answer in the user's own words. Simplify further if the user struggles; never escalate because earlier messages were complex.",
    rubric: "Assess a learner at a 12-year-old level. Reward one clear, relevant reason in everyday words. Biblical ideas may be paraphrased. Never penalize missing verse references, technical terms, historical sources, advanced nuance, or rhetoric. A short, sound answer can earn full marks. Only flag an actual contradiction, unsupported invention, or failure to address the one simple objection.",
  },
  Intermediate: {
    behavior: "A clear conversation for a Christian with 7–10 years of experience: one counter-argument at a time, without technical language.",
    expectations: "Explain your belief, give a relevant biblical idea in your own words, and answer the objection. Exact verse references are optional.",
    instruction: "Assume 7–10 years of Christian practice, but no formal theology training or memorized verse references. Use 3–5 short sentences, at most 100 words. Present one clear counter-argument and one focused follow-up question. Use familiar biblical ideas; explain any necessary theological term immediately. Accept accurate paraphrases without chapter-and-verse citations. Do not require academic sources, advanced rhetoric, or multiple lines of defense. Keep the exchange conversational and light.",
    rubric: "Assess an experienced Christian without assuming formal training. Reward a coherent explanation, a relevant biblical idea or accurate paraphrase, and a direct response to the objection. Exact Bible references and quotations are optional: never deduct points for their absence. Do not require scholarly sources, advanced rhetoric, or expert nuance. A concise, well-reasoned answer can earn full marks.",
  },
  Advanced: {
    behavior: "Stronger objections that test biblical context, counter-arguments, and your first steps in persuasive rhetoric.",
    expectations: "Give accurate Bible references, explain how they support your argument, answer counter-arguments, and begin using rhetoric effectively.",
    instruction: "Expect accurate Bible references, explanation of their context, a supported counter-argument, and emerging rhetorical skill. Use at most 160 words. Develop one substantial challenge at a time, probing interpretation, assumptions, or implications. Use purposeful rhetorical questions or comparisons, but end with only one question to answer. Do not confuse difficulty with verbosity or unexplained jargon. Acknowledge a well-supported response rather than endlessly moving the goalposts.",
    rubric: "Expect accurate, relevant Bible references and an explanation connecting their context to the claim. Assess the response to a meaningful counter-argument and developing rhetoric: clear framing, a useful comparison, or a persuasive structure. Distinguish merely naming a verse from using it well. Reward precise, concise reasoning; do not require doctoral-level scholarship or rhetorical mastery.",
  },
  Hostile: {
    behavior: "An expert theological opponent with demanding arguments, sharp rhetoric, and sustained intellectual pressure.",
    expectations: "Defend your position at an expert level with precise biblical context, strong rebuttals, rhetorical control, and honest treatment of uncertainty.",
    instruction: "Aim at doctoral-level theological and apologetic expertise. Use at most 220 words, with one central challenge per turn. Test precise exegesis, competing interpretations, doctrinal coherence, and the strongest relevant counter-evidence. Apply sophisticated rhetoric and pressure through framing, probing distinctions, and exposing evasions. Expect the user to recognize weak framing and respond persuasively. Hostile means intellectually demanding, not abusive or dishonest. Never deliberately introduce flawed objections, fabricated evidence, personal attacks, or misleading quotations. Concede valid points and keep the standard stable. End with one demanding question.",
    rubric: "Assess expert theological reasoning: precise Bible references in context, careful interpretation, strong rebuttals, doctrinal coherence, and rhetorical mastery under pressure. Reward identifying loaded framing, separating claims from evidence, and acknowledging uncertainty. Judge substance rather than jargon or length. Do not punish valid disagreement or require agreement with the AI's position.",
  },
};

export function getDebateDifficulty(difficulty) {
  return Object.hasOwn(debateDifficultyDescriptions, difficulty) ? debateDifficultyDescriptions[difficulty] : debateDifficultyDescriptions.Beginner;
}

export const debateScoringRubrics = Object.fromEntries(
  Object.entries(debateDifficultyDescriptions).map(([level, profile]) => [level, profile.rubric]),
);
