function firstStoryDetail(text, limit = 108) {
  const boundary = text.search(/[.!?](?:\s|$)/);
  const sentence = (boundary >= 0 ? text.slice(0, boundary + 1) : text).trim();
  if (sentence.length <= limit) return sentence;
  return `${sentence.slice(0, limit - 1).replace(/\s+\S*$/, '')}…`;
}

export function createKidsStoryScenes(texts) {
  return texts.map(text => ({ title: firstStoryDetail(text, 54), text }));
}

export function createKidsStoryQuestions(title, scenes, storyIndex = 0) {
  const details = scenes.map(scene => firstStoryDetail(scene.text));
  const promptByScene = [
    `Which detail begins “${title}”?`,
    `What important event happens in “${title}”?`,
    `Which moment is part of “${title}”?`,
  ];
  const answerOrder = (storyIndex * 7 + 1) % scenes.length;
  return scenes.map((scene, questionIndex) => {
    const correct = (answerOrder + questionIndex) % scenes.length;
    const choices = [...details];
    const answer = choices.splice(questionIndex, 1)[0];
    choices.splice(correct, 0, answer);
    return {
      question: promptByScene[questionIndex],
      choices: choices.map(detail => ['✦', detail]),
      correct,
      explanation: scene.text,
    };
  });
}

export function createKidsBookAdventures({ bookId, bookTitle, image, color = 'ocean', entries, readingNote, references = [] }) {
  return entries.map((entry, index) => {
    const [title, icon, opening, middle, ending, takeaway, mission, explicitReference] = entry;
    const reference = explicitReference || references[index] || `${bookTitle} ${index + 1}`;
    const scenes = createKidsStoryScenes([opening, middle, ending]);
    const questions = createKidsStoryQuestions(title, scenes, index);
    return {
      id: `${bookId}-${String(index + 1).padStart(2, '0')}`, bookId, contentRevision: 1,
      title, subtitle: `Explore ${reference}.`, reference, icon,
      badge: ['Story Seeker', 'Courage Keeper', 'Kindness Builder', 'Hope Finder'][index % 4],
      theme: ['Courage & trust', 'Wisdom & care', 'Justice & kindness', 'Hope & renewal'][index % 4],
      minutes: 6, image, color, coverPosition: '50%',
      intro: `Read this child-friendly retelling of ${reference}, then explore what the people learn.`,
      ...(readingNote ? { readingNote } : {}),
      scenes, questions, order: scenes.map(scene => [icon, scene.title]), takeaway, mission,
      prayer: `God, thank you for the story in ${reference}. Help me remember what is good and show care to others. Amen.`,
    };
  });
}
