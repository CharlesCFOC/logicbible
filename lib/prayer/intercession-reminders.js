export const INTERCESSION_REMINDERS_KEY = 'intercession.reminders.v1';

export const reminderDays = [
  { id: 'mon', label: 'Mon', short: 'M' },
  { id: 'tue', label: 'Tue', short: 'T' },
  { id: 'wed', label: 'Wed', short: 'W' },
  { id: 'thu', label: 'Thu', short: 'T' },
  { id: 'fri', label: 'Fri', short: 'F' },
  { id: 'sat', label: 'Sat', short: 'S' },
  { id: 'sun', label: 'Sun', short: 'S' },
];

// Every option lands on the same ten-minute rhythm as the global rooms, across the full day.
export const reminderSlots = Array.from({ length: 24 * 6 }, (_, index) => {
  const minutes = index * 10;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
});

export function emptyReminderSchedule(timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC') {
  return { version: 1, timeZone, days: Object.fromEntries(reminderDays.map(day => [day.id, []])) };
}

export function normalizeReminderSchedule(value) {
  const fallback = emptyReminderSchedule();
  if (!value || typeof value !== 'object') return fallback;
  const days = Object.fromEntries(reminderDays.map(day => {
    const selected = Array.isArray(value.days?.[day.id]) ? value.days[day.id] : [];
    return [day.id, [...new Set(selected.filter(slot => reminderSlots.includes(slot)))].sort()];
  }));
  return { version: 1, timeZone: typeof value.timeZone === 'string' && value.timeZone ? value.timeZone : fallback.timeZone, days };
}

export function readReminderSchedule(storage) {
  try { return normalizeReminderSchedule(JSON.parse(storage.getItem(INTERCESSION_REMINDERS_KEY))); } catch { return emptyReminderSchedule(); }
}

export function writeReminderSchedule(storage, schedule) {
  const normalized = normalizeReminderSchedule(schedule);
  try { storage.setItem(INTERCESSION_REMINDERS_KEY, JSON.stringify(normalized)); } catch { /* Local storage can be unavailable in private contexts. */ }
  return normalized;
}

export function countReminderSlots(schedule) {
  return reminderDays.reduce((total, day) => total + (schedule?.days?.[day.id]?.length || 0), 0);
}
