import { readFile } from 'node:fs/promises';
import { getSupabaseAdminClient } from '../lib/supabase/server.js';
import { validatePrayerJournal } from '../lib/prayer/intercession-journal.js';
import { intercessionTopics } from '../lib/prayer/intercession.js';

const rows = JSON.parse(await readFile(new URL('../data/prayer/intercession-journal.json', import.meta.url), 'utf8'));
for (const theme of intercessionTopics) validatePrayerJournal(theme.id, rows.filter(row => row.theme_id === theme.id));
const client = getSupabaseAdminClient();
for (let offset = 0; offset < rows.length; offset += 200) {
  const { error } = await client.from('intercession_prayer_lines').upsert(rows.slice(offset, offset + 200), {
    onConflict: 'focus_id,language,sequence', ignoreDuplicates: !process.argv.includes('--replace'),
  });
  if (error) throw new Error(`Could not seed prayer messages: ${error.message}`);
}
const { count, error } = await client.from('intercession_prayer_lines').select('*', { count: 'exact', head: true });
if (error) throw error;
console.log(`Prayer catalogue ready: ${count} messages. Existing edits preserved unless --replace is supplied.`);
