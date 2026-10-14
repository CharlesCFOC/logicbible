import test from 'node:test';
import assert from 'node:assert/strict';
import { createKidsBadgeStore } from '../src/react/kids-badges-store.js';
const memory = () => { const m = new Map(); return { getItem: key => m.get(key) ?? null, setItem: (key, value) => m.set(key, value) }; };
const harness = () => {
  let user = null, fail = false;
  const rows = new Map();
  const bridge = { getUserId: () => user, load: async () => [...(rows.get(user)?.values() || [])], save: async (adventureId, earnedAt) => { if (fail) throw Error('Offline'); const own = rows.get(user) || new Map(); if (!own.has(adventureId)) own.set(adventureId, { adventureId, earnedAt }); rows.set(user, own); } };
  return { bridge, rows, setUser: value => { user = value; }, setFail: value => { fail = value; } };
};
test('guest awards survive reload, are adopted once, and never move between signed-in accounts', async () => {
  const h = harness(), storage = memory();
  let s = createKidsBadgeStore(h.bridge, storage);
  await s.earn('genesis-noah');await s.earn('genesis-noah');assert.equal(s.getSnapshot().records.length, 1);
  s = createKidsBadgeStore(h.bridge, storage);assert.equal(s.getSnapshot().records.length, 1);
  h.setUser('a');await s.sync();assert.equal(h.rows.get('a').size, 1);assert.equal(s.getSnapshot().status, 'synced');
  h.setUser(null);await s.sync();assert.equal(s.getSnapshot().records.length, 0);
  h.setUser('b');await s.sync();assert.equal(s.getSnapshot().records.length, 0);
  h.setUser('a');await s.sync();assert.equal(s.getSnapshot().records.length, 1);
});
test('failed cloud writes remain queued and a retry saves one record without changing its earned date', async () => {
  const h = harness();h.setUser('a');h.setFail(true);
  const s = createKidsBadgeStore(h.bridge, memory());await s.earn('storm');const date = s.getSnapshot().records[0].earnedAt;
  assert.equal(s.getSnapshot().status, 'pending');h.setFail(false);await s.sync();await s.earn('storm');assert.equal(h.rows.get('a').size, 1);assert.equal(s.getSnapshot().records[0].earnedAt, date);assert.equal(s.getSnapshot().status, 'synced');
});
test('a slow request from the previous account cannot overwrite the new account collection', async () => {
  const h = harness();let resolve;h.setUser('a');const original = h.bridge.load;
  h.bridge.load = () => h.bridge.getUserId() === 'a' ? new Promise(r => { resolve = r; }) : original();
  const s = createKidsBadgeStore(h.bridge, memory());const old = s.sync();h.setUser('b');await s.sync();resolve([{ adventureId: 'storm', earnedAt: new Date().toISOString() }]);await old;
  assert.equal(s.getSnapshot().userId, 'b');assert.deepEqual(s.getSnapshot().records, []);
});
test('cloud awards restore on a new device and unavailable local storage does not lose session awards', async () => {
  const h = harness();h.setUser('a');await h.bridge.save('seeds', new Date().toISOString());const s = createKidsBadgeStore(h.bridge, memory());await s.sync();assert.equal(s.getSnapshot().records[0].adventureId, 'seeds');
  h.setUser(null);const denied = { getItem(){throw Error('Blocked');}, setItem(){throw Error('Blocked');} };const guest = createKidsBadgeStore(h.bridge, denied);await guest.earn('genesis-joseph');await guest.earn('genesis-joseph');assert.equal(guest.getSnapshot().records.length, 1);
});
