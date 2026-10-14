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
    const messages = [
      `Father, we come before you to pray for ${focus.title.toLowerCase()}.`,
      `Lord, ${petitions[0]}.`,
      `Jesus, ${petitions[0]}, especially for those whose needs are unseen.`,
      `Jesus, ${petitions[1]}.`,
      `Help us listen with compassion and respond with patience as we pray for ${focus.title.toLowerCase()}.`,
      `Father, ${petitions[2]}.`,
      `Let your word in ${focus.verse} strengthen and guide us as we pray.`,
      `We ask for your faithful care as we pray: ${petitions[1]}.`,
      `In your mercy, ${petitions[2]}.`,
      `Father, help us respond with compassion as we pray for ${focus.title.toLowerCase()}.`,
      'We entrust these people and situations to you, and thank you for hearing us.',
      'In Jesus’ name, we offer this prayer. Amen.',
    ];
    messages.forEach((body, sequence) => rows.push({ theme_id: theme.id, focus_id: focus.id, language: 'en', sequence, body }));
  });
}
await writeFile(new URL('../data/prayer/intercession-journal.json', import.meta.url), `${JSON.stringify(rows, null, 2)}\n`);
console.log(`Prepared ${rows.length} prayer messages for ${rows.length / 12} focuses.`);
