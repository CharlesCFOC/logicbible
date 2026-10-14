import test from 'node:test';
import assert from 'node:assert/strict';
import { countReminderSlots, emptyReminderSchedule, normalizeReminderSchedule, readReminderSchedule, reminderDays, reminderSlots, writeReminderSchedule } from '../lib/prayer/intercession-reminders.js';

test('reminder schedules keep only aligned weekly slots', () => {
  const schedule = normalizeReminderSchedule({ timeZone: 'America/Toronto', days: { mon: ['07:00', 'invalid', '07:00'], sun: ['20:20'] } });
  assert.deepEqual(schedule.days.mon, ['07:00']);
  assert.deepEqual(schedule.days.sun, ['20:20']);
  assert.equal(countReminderSlots(schedule), 2);
  assert.equal(reminderDays.length, 7);
  assert.equal(reminderSlots.length, 144);
  assert.equal(reminderSlots[0], '00:00');
  assert.equal(reminderSlots.at(-1), '23:50');
  assert.ok(reminderSlots.every(slot => /^\d{2}:[0-5]\d$/.test(slot)));
});

test('reminder schedules survive local storage and tolerate malformed data', () => {
  const map = new Map();
  const storage = { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value) };
  const empty = emptyReminderSchedule();
  assert.deepEqual(readReminderSchedule(storage), empty);
  const saved = writeReminderSchedule(storage, { timeZone: 'UTC', days: { tue: ['12:10'] } });
  assert.deepEqual(readReminderSchedule(storage), saved);
  map.set('intercession.reminders.v1', '{bad');
  assert.deepEqual(readReminderSchedule(storage), emptyReminderSchedule());
});
