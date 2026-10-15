import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../script.js', import.meta.url), 'utf8');
function harness() {
  const local = new Map(), remote = new Map();
  const hooks = { fail: false, beforeWrite: null };
  const localStorage = { getItem: key => local.get(key) ?? null, setItem: (key, value) => local.set(key, String(value)), removeItem: key => local.delete(key) };
  const context = vm.createContext({ localStorage,
    readJson(key, fallback) { try {return JSON.parse(localStorage.getItem(key)) ?? fallback;} catch {return fallback;} },
    console: {warn() {}}, pendingSyncKey: 'pending', supabaseUser: {id: 'reader'}, isHydratingSupabase: false,
    supabaseClient: { from: () => ({ async upsert(row) {
      if (hooks.beforeWrite) await hooks.beforeWrite(row);
      if (hooks.fail) return {error: {message: 'Offline'}};
      assert.equal(row.user_id, 'reader');
      remote.set(row.state_key, row.payload);
      return {error: null};
    } }) },
  });
  vm.runInContext(source.slice(source.indexOf('function parseStoredValue('), source.indexOf('function setAuthFeedback(')), context);
  const queue = (key, value) => { localStorage.setItem(key, JSON.stringify(value)); context.markPendingSync(key); return context.syncPendingState(); };
  return {context, localStorage, remote, hooks, queue};
}

test('rapid story changes cannot let a slow scene write replace the fourth scene', async () => {
  const h = harness();
  const key = 'brother.kidsAdventure.v1.genesis-garden-choice';
  let started, release;
  const beginning = new Promise(resolve => {started = resolve;});
  h.hooks.beforeWrite = () => new Promise(resolve => {release = resolve; started();});
  const writing = h.queue(key, {stage: 1, scene: 1});
  await beginning;
  h.queue(key, {stage: 1, scene: 2});
  h.queue(key, {stage: 1, scene: 3});
  h.hooks.beforeWrite = null;
  release();
  await writing;
  assert.equal(h.remote.get(key).value.scene, 3);
  assert.equal(h.context.getPendingSyncKeys().size, 0);
});

test('offline story and resume-pointer changes remain queued and synchronize on retry', async () => {
  const h = harness(); h.hooks.fail = true;
  const key = 'brother.kidsAdventure.v1.genesis-garden-choice';
  await h.queue(key, {stage: 1, scene: 3});
  h.localStorage.setItem('brother.kidsAdventure.last', 'genesis-garden-choice');
  h.context.markPendingSync('brother.kidsAdventure.last');
  assert.ok(h.context.getPendingSyncKeys().has(key));
  h.hooks.fail = false;
  await h.context.syncPendingState();
  assert.equal(h.remote.get(key).value.scene, 3);
  assert.equal(h.remote.get('brother.kidsAdventure.last').value, 'genesis-garden-choice');
  assert.equal(h.context.getPendingSyncKeys().size, 0);
});
