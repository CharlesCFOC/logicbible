import { GLOBAL_SESSION_MS, intercessionTopics } from './intercession.js';

export const voteKey = sessionStart => `intercession-vote:${sessionStart}`;
export const isPrayerTheme = id => intercessionTopics.some(topic => topic.id === id);
export function tallyPrayerVotes(rows, sessionStart) {
  const counts = Object.fromEntries(intercessionTopics.map(topic => [topic.id, 0]));
  for (const row of rows) {
    const updatedAt = Date.parse(row.updated_at);
    if (row.state_key === voteKey(sessionStart) && isPrayerTheme(row.payload?.topicId)
      && updatedAt >= sessionStart - GLOBAL_SESSION_MS && updatedAt < sessionStart) counts[row.payload.topicId]++;
  }
  return counts;
}
export function winningPrayerTheme(counts) {
  // A stable order breaks ties identically for every participant; Families is the fallback.
  return intercessionTopics.reduce((winner, topic) => (counts[topic.id] || 0) > (counts[winner] || 0) ? topic.id : winner, 'families');
}
export async function readPrayerVoteSummary(admin, userId, now = Date.now()) {
  const sessionStart = Math.floor(now / GLOBAL_SESSION_MS) * GLOBAL_SESSION_MS;
  const nextSessionStart = sessionStart + GLOBAL_SESSION_MS;
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await admin.from('user_app_state')
      .select('user_id,state_key,payload,updated_at').in('state_key', [voteKey(sessionStart), voteKey(nextSessionStart)])
      .order('user_id').order('state_key').range(offset, offset + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  const counts = tallyPrayerVotes(rows, nextSessionStart);
  const own = rows.find(row => row.user_id === userId && row.state_key === voteKey(nextSessionStart));
  return { sessionStart, nextSessionStart, currentTheme: winningPrayerTheme(tallyPrayerVotes(rows, sessionStart)),
    counts, leadingTheme: winningPrayerTheme(counts), ownVote: isPrayerTheme(own?.payload?.topicId) ? own.payload.topicId : null,
    signedIn: Boolean(userId) };
}
export async function savePrayerVote(admin, userId, topicId, nextSessionStart, now = Date.now()) {
  const expected = (Math.floor(now / GLOBAL_SESSION_MS) + 1) * GLOBAL_SESSION_MS;
  if (topicId !== null && !isPrayerTheme(topicId)) throw Object.assign(new Error('Choose a valid prayer theme.'), { status: 400 });
  if (nextSessionStart !== expected) throw Object.assign(new Error('A new session has started. Please vote again.'), { status: 409 });
  if (topicId === null) {
    const { error } = await admin.from('user_app_state').delete().eq('user_id', userId).eq('state_key', voteKey(expected));
    if (error) throw error;
    return;
  }
  const { error } = await admin.from('user_app_state').upsert({ user_id: userId, state_key: voteKey(expected), payload: { topicId } }, { onConflict: 'user_id,state_key' });
  if (error) throw error;
}
