// A topic unrelated to the original suffering pilot exercises scenario isolation.
export function makeChurchScenario(topic = 'Le pardon après une trahison') {
  return {
    title: topic, question: 'Comment reconstruire une relation avec vérité et amour ?',
    context: 'Après une promesse non tenue, Camille demande conseil à un ami chrétien.',
    goal: 'Accueillir la blessure et proposer une démarche de pardon sans nier la justice.',
    character: { name: 'Camille', description: 'Une amie blessée par une promesse rompue', detail: 'Elle cherche une réponse honnête.' },
    summit: { name: 'Un prochain pas libre', line: 'Je suis prête à réfléchir à cette démarche.', detail: 'Le pardon ne supprime ni les limites ni la responsabilité.' },
    stages: ['Écouter', 'Rejoindre', 'Éclairer', 'Proposer'].map((title, index) => {
      const choices = () => Array.from('ABCD', (id, i) => ({ id, text: `${title}, option ${id} : prenons le temps de comprendre la situation.`,
        reaction: `Je réagis à la réponse ${id} de cette étape ${index + 1}.`, review: 'L’amour du prochain demande une écoute attentive et une parole vraie.', quality: i === (index + 1) % 4 ? 'solid' : i === index ? 'mixed' : 'risky', value: 'love' }));
      return { title, objective: `Objectif ${title.toLowerCase()} avec humilité.`, cue: 'La discussion continue avec Camille.', line: `Question ${index + 1} : dois-je faire confiance de nouveau ?`, reference: 'Éphésiens 4:32', choices: choices(),
        repair: { title: `Réparer : ${title}`, cue: 'Camille demande une clarification.', line: 'Peux-tu répondre sans minimiser ma blessure ?', reference: 'Jacques 1:19', choices: choices() } };
    }),
  };
}
