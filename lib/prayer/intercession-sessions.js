import { intercessionTopics } from './intercession.js';

const isUuid = value => /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(String(value || ''));
const isIsoDate = value => Number.isFinite(Date.parse(value));

export async function saveIntercessionSession(admin, userId, payload) {
  if (!isUuid(userId)) throw Object.assign(new Error('Sign in to save your prayer session.'), { status: 401 });
  const themeId = String(payload?.themeId || '');
  const startedAt = String(payload?.startedAt || '');
  const finishedAt = String(payload?.finishedAt || '');
  const durationSeconds = Number(payload?.durationSeconds);
  if (!intercessionTopics.some(theme => theme.id === themeId) || !isIsoDate(startedAt) || !isIsoDate(finishedAt)
    || !Number.isInteger(durationSeconds) || durationSeconds < 0 || durationSeconds > 600 || Date.parse(finishedAt) < Date.parse(startedAt)) {
    throw Object.assign(new Error('This prayer session is not valid.'), { status: 400 });
  }
  const { error } = await admin.from('intercession_prayer_sessions').insert({
    user_id: userId,
    theme_id: themeId,
    started_at: new Date(Date.parse(startedAt)).toISOString(),
    finished_at: new Date(Date.parse(finishedAt)).toISOString(),
    duration_seconds: durationSeconds,
  });
  if (error) throw error;
}

export async function readIntercessionStats(admin, userId) {
  if (!isUuid(userId)) return { sessionCount: 0, totalSeconds: 0 };
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await admin.from('intercession_prayer_sessions').select('duration_seconds').eq('user_id', userId).order('created_at', { ascending: false }).range(offset, offset + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return { sessionCount: rows.length, totalSeconds: rows.reduce((total, row) => total + (Number(row.duration_seconds) || 0), 0) };
}

export async function readIntercessionReminders(admin, userId) {
  if (!isUuid(userId)) return null;
  const { data, error } = await admin.from('intercession_prayer_reminders').select('timezone,schedule,updated_at').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data ? { timeZone: data.timezone, schedule: data.schedule, updatedAt: data.updated_at } : null;
}

export async function saveIntercessionReminders(admin, userId, payload) {
  if (!isUuid(userId)) throw Object.assign(new Error('Sign in to save session reminders.'), { status: 401 });
  const timezone = String(payload?.timeZone || 'UTC').slice(0, 100);
  if (!payload?.schedule || typeof payload.schedule !== 'object' || Array.isArray(payload.schedule)) {
    throw Object.assign(new Error('Choose at least one reminder schedule.'), { status: 400 });
  }
  const { error } = await admin.from('intercession_prayer_reminders').upsert({ user_id: userId, timezone, schedule: payload.schedule, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) throw error;
  return { timeZone: timezone, schedule: payload.schedule };
}
