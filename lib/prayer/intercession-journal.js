import { GLOBAL_SESSION_MS, GLOBAL_TOPIC_MS, intercessionTopics, getPrayerTopics } from './intercession.js';

export const PRAYER_LINE_MS = 10_000;
export const PRAYER_LINES_PER_FOCUS = GLOBAL_TOPIC_MS / PRAYER_LINE_MS;
export function validatePrayerJournal(themeId, rows) {
  if (!intercessionTopics.some(theme => theme.id === themeId)) throw Object.assign(new Error('Unknown prayer theme.'), { status: 400 });
  const focuses = getPrayerTopics(themeId);
  if (!Array.isArray(rows) || rows.length !== focuses.length * PRAYER_LINES_PER_FOCUS) throw Object.assign(new Error('Guided prayer is temporarily unavailable.'), { status: 503 });
  const keys = new Set();
  for (const row of rows) {
    const key = `${row.focus_id}:${row.sequence}`;
    if (row.theme_id !== themeId || row.language !== 'en' || !focuses.some(focus => focus.id === row.focus_id)
      || !Number.isInteger(row.sequence) || row.sequence < 0 || row.sequence >= PRAYER_LINES_PER_FOCUS
      || typeof row.body !== 'string' || row.body.trim().length < 12 || row.body.length > 600 || keys.has(key)) {
      throw Object.assign(new Error('Guided prayer is temporarily unavailable.'), { status: 503 });
    }
    keys.add(key);
  }
  return rows;
}
export async function readPrayerJournal(client, themeId) {
  if (!intercessionTopics.some(theme => theme.id === themeId)) throw Object.assign(new Error('Unknown prayer theme.'), { status: 400 });
  const { data, error } = await client.from('intercession_prayer_lines')
    .select('theme_id,focus_id,language,sequence,body').eq('theme_id', themeId).eq('language', 'en')
    .order('focus_id').order('sequence');
  if (error) throw Object.assign(new Error('Guided prayer is temporarily unavailable.'), { status: 503 });
  return validatePrayerJournal(themeId, data);
}
export function getPublishedPrayerLines(themeId, rows, sessionStartsAt, now) {
  if (now < sessionStartsAt || now >= sessionStartsAt + GLOBAL_SESSION_MS) return [];
  const focuses = getPrayerTopics(themeId);
  return rows.map(row => {
    const focusIndex = focuses.findIndex(focus => focus.id === row.focus_id);
    if (focusIndex < 0 || row.theme_id !== themeId) return null;
    const publishedAt = sessionStartsAt + focusIndex * GLOBAL_TOPIC_MS + row.sequence * PRAYER_LINE_MS;
    return { id: `${sessionStartsAt}:${row.focus_id}:${row.sequence}`, body: row.body, focusId: row.focus_id,
      focusTitle: focuses[focusIndex].title, publishedAt, elapsedSeconds: (publishedAt - sessionStartsAt) / 1000 };
  }).filter(line => line && line.publishedAt <= now).sort((a, b) => a.publishedAt - b.publishedAt);
}
