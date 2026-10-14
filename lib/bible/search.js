export const searchTopics = [
  { name: 'Anxiety', aliases: ['anxiety', 'worry', 'fear', 'stress'], verses: ['PHP.4.6','PHP.4.7','MAT.6.34','1PE.5.7'] },
  { name: 'Peace', aliases: ['peace', 'calm'], verses: ['JHN.14.27','PHP.4.7','ISA.26.3'] },
  { name: 'Forgiveness', aliases: ['forgiveness', 'forgive', 'mercy'], verses: ['EPH.4.32','COL.3.13','MAT.6.14','1JN.1.9'] },
  { name: 'Prayer', aliases: ['prayer', 'pray'], verses: ['MAT.6.9','PHP.4.6','1TH.5.17','JAS.5.16'] },
  { name: 'Love', aliases: ['love', 'loving'], verses: ['1CO.13.4','1CO.13.5','JHN.13.34','1JN.4.19'] },
  { name: 'Faith', aliases: ['faith', 'trust', 'belief'], verses: ['HEB.11.1','PRO.3.5','PRO.3.6','ROM.10.17'] },
  { name: 'Hope', aliases: ['hope', 'discouragement'], verses: ['ROM.15.13','HEB.10.23','PSA.42.11'] },
  { name: 'Grief', aliases: ['grief', 'sadness', 'mourning', 'loss'], verses: ['MAT.5.4','PSA.34.18','REV.21.4'] },
  { name: 'Strength', aliases: ['strength', 'courage', 'weakness'], verses: ['ISA.40.31','PHP.4.13','JOS.1.9','2CO.12.9'] },
  { name: 'Wisdom', aliases: ['wisdom', 'guidance', 'decisions'], verses: ['JAS.1.5','PRO.3.6','PSA.119.105'] },
  { name: 'Salvation', aliases: ['salvation', 'saved', 'eternal life'], verses: ['JHN.3.16','ROM.10.9','EPH.2.8','EPH.2.9'] },
  { name: 'Temptation', aliases: ['temptation', 'tempted', 'sin'], verses: ['1CO.10.13','JAS.4.7','HEB.4.15'] },
  { name: 'Gratitude', aliases: ['gratitude', 'thankful', 'thanksgiving'], verses: ['1TH.5.18','PSA.100.4','COL.3.17'] },
  { name: 'Family', aliases: ['family', 'parents', 'children', 'marriage'], verses: ['EPH.6.1','EPH.6.4','COL.3.19','PSA.127.3'] },
  { name: 'Humility', aliases: ['humility', 'humble', 'pride'], verses: ['PHP.2.3','JAS.4.10','PRO.16.18'] },
];
export function findSearchTopic(query) {
  const words = query.toLowerCase().match(/[a-z]+/g) || [];
  return searchTopics.find(topic => topic.aliases.includes(query.toLowerCase().trim()))
    || searchTopics.find(topic => topic.aliases.some(alias => words.includes(alias)));
}
export function literalSearchQuery(query, mode) {
  return mode === 'expression' ? `"${query.replace(/["\\]/g, '')}"` : query.replace(/["*~:+()\\]/g, '');
}
