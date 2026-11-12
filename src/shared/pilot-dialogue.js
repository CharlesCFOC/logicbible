// Short emotional and key passages from Marc’s English dialogue.
// Keep negations intact and limit emphasis to two passages per message.
const passages = [
  "why the claim would be right", "my question is still there", "not to brush it aside",
  "what does your faith actually offer", "a person who is suffering", "ill or grieving", "their faith not strong enough",
  "earn our way to God", "when we’ve done enough", "what you believe Jesus has done for us", "what you expect me to do",
  "I’m interested", "still be able to ask my questions", "my interest and questions don’t count",

  "I don’t feel understood", "I don’t feel heard", "I don’t feel listened to", "I’m not convinced yet", "I’m not convinced", "I don’t agree",
  "nobody’s choice", "why wouldn’t he", "the victims deserved", "I find unjust", "you’re avoiding it", "I feel you’re avoiding it",
  "more heard", "someone who is suffering", "this tragedy was necessary", "take my objection seriously",
  "acknowledge the limits", "blaming the victims", "my lack of faith", "what I actually said",
  "without claiming to explain everything", "my question remains", "not leave it aside",
  "sick or grieving", "their faith wasn’t enough", "Jesus as a real person", "hide their sadness", "hide her sadness",
  "Jesus who weeps", "his death and resurrection", "without promising an end to suffering", "hide the pain",
  "I understand the difference better", "our relationship with God", "a guarantee of protection", "lost a loved one",
  "a philosophy of life", "what you believe about Jesus", "need to understand", "earn forgiveness", "where grace comes in",
  "a gift, not a standard to reach", "a relationship with God", "just a change in my emotions", "join a community",
  "what you expect from me", "not just a pleasant feeling", "That’s clearer", "I still have questions",
  "words I don’t understand", "wouldn’t be an honest response", "I don’t want to pretend", "without pretending to believe",
  "want to stop", "isn’t the same as believing", "respect that difference", "what I don’t understand",
  "Yes, I’d like that", "honestly what I think", "without pretending to share it", "continue on that basis",
  "I’m willing", "keep asking my questions", "my interest and questions don’t matter", "not what I said",
  "My objections are part of my thinking", "still leave me tense", "still need time to trust you", "really difficult for me",
  "if you don’t know the answer", "how will we continue", "leaving me the choice", "specific correction reassures me",
  "small step reassures me", "what hurt me", "freedom to disagree", "control over what I share",
];
const escapePattern = text => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/[’']/g, "[’']");

// Older generated stories sometimes put stage directions in the dialogue field.
// Keep those descriptions intact without attributing them as spoken words.
export function pilotReactionContent(reaction, characterName, narration = '') {
  const speech = String(reaction || '').trim();
  const namedDescription = characterName && new RegExp(`^[\\s"“«]*${escapePattern(characterName)}\\s+`, 'iu').test(speech);
  return namedDescription
    ? { speech: '', narration: [narration, speech].filter(Boolean).join(' ') }
    : { speech, narration };
}

export function groupPilotConversation(messages) {
  const groups = [];
  for (const message of messages) {
    const previous = groups.at(-1);
    // The character's reaction flows into the next discussion point as one
    // message, while the exact individual lines remain in the saved transcript.
    if (message.role === 'marc' && previous?.role === 'marc') {
      previous.text += `\n\n${message.text}`;
    } else groups.push({ ...message });
  }
  return groups;
}
const authoredPattern = passages.sort((a, b) => b.length - a.length).map(escapePattern).join("|");
// Optional AI reformulations can use different words for the same emotion.
const feelingPattern = "I(?:[’']m| am| feel| still feel| don[’']t feel)(?: (?:still|not|not yet|more|increasingly|really))? (?:judged|heard|understood|reassured|hurt|frustrated|worried|puzzled|tense|skeptical|cautious|convinced|disappointed|betrayed|brushed aside again|pressured|on my guard|confident|free to question)";

export function pilotDialogueSegments(text) {
  const pattern = new RegExp(`${authoredPattern}|${feelingPattern}`, "giu");
  const segments = [];
  let cursor = 0;
  let count = 0;
  for (const match of text.matchAll(pattern)) {
    if (count === 2) break;
    if (match.index > cursor) segments.push({ text: text.slice(cursor, match.index), emphasis: false });
    segments.push({ text: match[0], emphasis: true });
    cursor = match.index + match[0].length;
    count++;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), emphasis: false });
  return segments;
}
