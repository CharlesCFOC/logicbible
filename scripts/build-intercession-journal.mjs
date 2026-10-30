import { readFile, writeFile } from 'node:fs/promises';
import { intercessionTopics, getPrayerTopics } from '../lib/prayer/intercession.js';

const source = JSON.parse(await readFile(new URL('../data/prayer/intercession-petitions.json', import.meta.url), 'utf8'));
const rows = [];
for (const theme of intercessionTopics) {
  const topics = getPrayerTopics(theme.id);
  if (source[theme.id]?.length !== topics.length) throw new Error(`Missing petitions: ${theme.id}`);
  topics.forEach((focus, index) => {
    const petitions = source[theme.id][index];
    if (petitions?.length !== 3 || petitions.some(text => typeof text !== 'string' || text.length < 20)) throw new Error(`Incomplete petitions: ${focus.id}`);
    const [first, second, third] = petitions;
    const subject = focus.title.toLowerCase();
    const messages = [
      `God of compassion, we bring ${subject} into your presence.`,
      `For those affected, we ask: ${first}.`,
      `Where this need feels heavy, please ${second}.`,
      `In the days ahead, may ${third}.`,
      `Meet each person in ${subject} with the care and strength they need today.`,
      `Give us attentive hearts so we can notice who needs support and respond well.`,
      `As we remember ${focus.verse}, steady our hope and shape the way we care for one another.`,
      `When progress is difficult to see, remain near to those for whom we pray.`,
      `Make us ready to offer practical help, patient listening, and words that bring comfort.`,
      `We place these particular needs before you: ${first}, and ${third}.`,
      `Thank you for hearing every quiet request and for holding each person in your care.`,
      `With trust in your love, we pray in Jesus’ name. Amen.`,
    ];
    messages.forEach((body, sequence) => rows.push({ theme_id: theme.id, focus_id: focus.id, language: 'en', sequence, body }));
  });
}
await writeFile(new URL('../data/prayer/intercession-journal.json', import.meta.url), `${JSON.stringify(rows, null, 2)}\n`);
console.log(`Prepared ${rows.length} prayer messages for ${rows.length / 12} focuses.`);
