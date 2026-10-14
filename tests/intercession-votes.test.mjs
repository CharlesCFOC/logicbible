import test from 'node:test';
import assert from 'node:assert/strict';
import { tallyPrayerVotes, winningPrayerTheme, savePrayerVote, voteKey } from '../lib/prayer/intercession-votes.js';
import { getPrayerTopics, getPrayerGuides, intercessionTopics } from '../lib/prayer/intercession.js';
const row = (topicId, updatedAt, session = 600_000) => ({ state_key: voteKey(session), payload: { topicId }, updated_at: new Date(updatedAt).toISOString() });

test('only valid ballots submitted within the correct voting window count', () => {
  const counts = tallyPrayerVotes([row('healing', 120_000), row('healing', 599_999), row('church', 250_000), row('invalid', 1), row('families', 600_000), row('families', -1), row('families', 1, 1_200_000)], 600_000);
  assert.equal(Object.keys(counts).length, 23);
  assert.equal(counts.healing, 2);
  assert.equal(counts.church, 1);
  assert.equal(Object.values(counts).reduce((total, count) => total + count, 0), 3);
  assert.equal(winningPrayerTheme(counts), 'healing');
});
test('ties and sessions with no votes have a deterministic result', () => {
  assert.equal(winningPrayerTheme({}), 'families');
  assert.equal(winningPrayerTheme({ healing: 3, church: 3 }), 'healing');
  assert.equal(winningPrayerTheme({ families: 3, healing: 3 }), 'families');
});
test('a changed vote replaces the same account ballot and closes at the session boundary', async () => {
  const records = new Map();
  const admin = { from(table) { assert.equal(table, 'user_app_state'); return { async upsert(value, options) {
    assert.equal(options.onConflict, 'user_id,state_key'); records.set(`${value.user_id}/${value.state_key}`, value); return { error: null };
  } }; } };
  await savePrayerVote(admin, 'person-1', 'healing', 600_000, 120_000);
  await savePrayerVote(admin, 'person-1', 'church', 600_000, 250_000);
  assert.equal(records.size, 1);
  assert.equal([...records.values()][0].payload.topicId, 'church');
  await assert.rejects(savePrayerVote(admin, 'person-1', 'healing', 600_000, 600_000), error => error.status === 409);
  await assert.rejects(savePrayerVote(admin, 'person-1', 'invalid', 600_000, 1), error => error.status === 400);
  assert.equal(records.size, 1);
});
test('all themes offer five distinct two-minute focuses with prayer guidance', () => {
  for (const theme of intercessionTopics) {
    const topics = getPrayerTopics(theme.id);
    assert.equal(topics.length, 5);
    if (theme.id !== 'families') assert.ok(topics.every(topic => topic.id.startsWith(`${theme.id}-`)));
    assert.equal(new Set(topics.map(topic => topic.id)).size, 5);
    for (let index = 0; index < 5; index++) {
      assert.ok(topics[index].title && topics[index].detail && topics[index].verse);
      assert.equal(getPrayerGuides(theme.id, index).length, 3);
    }
  }
});

test('withdrawing a vote targets only that user and the next session', async () => {
  const filters = [];
  const admin = { from(table) { assert.equal(table, 'user_app_state'); return { delete() { return { eq(column, value) {
    filters.push([column, value]); return { async eq(column, value) { filters.push([column, value]); return { error: null }; } };
  } }; } }; } };
  await savePrayerVote(admin, 'person-1', null, 600_000, 100_000);
  assert.deepEqual(filters, [['user_id', 'person-1'], ['state_key', voteKey(600_000)]]);
});

 test('new themes are eligible for voting and can lead the next session', async () => {
  assert.equal(intercessionTopics.length, 23);
  assert.equal(new Set(intercessionTopics.map(theme => theme.id)).size, 23);
  const counts = tallyPrayerVotes([row('education', 120_000), row('education', 130_000), row('gratitude', 140_000)], 600_000);
  assert.equal(winningPrayerTheme(counts), 'education');
  let saved;
  const admin = { from() { return { async upsert(value) { saved = value; return { error: null }; } }; } };
  await savePrayerVote(admin, 'person-1', 'loneliness', 600_000, 120_000);
  assert.equal(saved.payload.topicId, 'loneliness');
});

test('anxiety, stress, and repentance can receive votes and win a session', () => {
  for (const id of ['anxiety', 'stress', 'repentance']) {
    assert.ok(intercessionTopics.some(theme => theme.id === id));
    const counts = tallyPrayerVotes([row(id, 120_000), row(id, 130_000), row('families', 140_000)], 600_000);
    assert.equal(counts[id], 2);
    assert.equal(winningPrayerTheme(counts), id);
  }
});
