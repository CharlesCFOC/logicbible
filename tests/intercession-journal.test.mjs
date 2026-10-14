import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { intercessionTopics } from '../lib/prayer/intercession.js';
import { validatePrayerJournal, getPublishedPrayerLines } from '../lib/prayer/intercession-journal.js';
const catalogue = JSON.parse(await readFile(new URL('../data/prayer/intercession-journal.json', import.meta.url), 'utf8'));
const familyLines = catalogue.filter(row => row.theme_id === 'families');

test('every prayer theme has twelve ready-to-publish sentences for each of its five focuses', () => {
  assert.equal(catalogue.length, 1380);
  for (const theme of intercessionTopics) {
    const rows = validatePrayerJournal(theme.id, catalogue.filter(row => row.theme_id === theme.id));
    assert.equal(rows.length, 60);
    for (const focusId of new Set(rows.map(row => row.focus_id))) {
      const messages = rows.filter(row => row.focus_id === focusId);
      assert.equal(messages.length, 12);
      assert.equal(new Set(messages.map(row => row.body)).size, 12);
    }
  }
});
test('one message publishes immediately, then another every ten seconds without revealing future lines', () => {
  for (let sequence = 0; sequence < 12; sequence++) {
    const messages = getPublishedPrayerLines('families', familyLines, 600_000, 600_000 + sequence * 10_000);
    assert.equal(messages.length, sequence + 1);
    assert.equal(messages.at(-1).elapsedSeconds, sequence * 10);
    assert.ok(messages.every(line => line.publishedAt <= 600_000 + sequence * 10_000));
  }
  assert.equal(getPublishedPrayerLines('families', familyLines, 600_000, 609_999).length, 1);
});
test('late arrivals and backgrounded tabs catch up to the same shared timeline', () => {
  const messages = getPublishedPrayerLines('families', familyLines, 600_000, 673_456);
  assert.equal(messages.length, 8);
  assert.equal(messages.at(-1).publishedAt, 670_000);
  const atChange = getPublishedPrayerLines('families', familyLines, 600_000, 720_000);
  assert.equal(atChange.length, 13);
  assert.equal(atChange.at(-1).focusId, 'family-unity');
  assert.equal(atChange.at(-2).focusId, 'family-restoration');
  assert.equal(getPublishedPrayerLines('families', familyLines, 600_000, 1_199_999).length, 60);
});
test('a new session starts a fresh journal with distinct message identities', () => {
  assert.deepEqual(getPublishedPrayerLines('families', familyLines, 600_000, 599_999), []);
  assert.deepEqual(getPublishedPrayerLines('families', familyLines, 600_000, 1_200_000), []);
  const before = getPublishedPrayerLines('families', familyLines, 600_000, 600_000);
  const after = getPublishedPrayerLines('families', familyLines, 1_200_000, 1_200_000);
  assert.equal(after.length, 1);
  assert.notEqual(before[0].id, after[0].id);
});
test('incomplete, duplicate, and mismatched database content is rejected', () => {
  assert.throws(() => validatePrayerJournal('unknown', []), error => error.status === 400);
  assert.throws(() => validatePrayerJournal('families', familyLines.slice(1)), error => error.status === 503);
  assert.throws(() => validatePrayerJournal('families', [familyLines[1], ...familyLines.slice(1)]), error => error.status === 503);
  assert.throws(() => validatePrayerJournal('families', [{ ...familyLines[0], theme_id: 'anxiety' }, ...familyLines.slice(1)]), error => error.status === 503);
  assert.throws(() => validatePrayerJournal('families', [{ ...familyLines[0], body: '' }, ...familyLines.slice(1)]), error => error.status === 503);
});
