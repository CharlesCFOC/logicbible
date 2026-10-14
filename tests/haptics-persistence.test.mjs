import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../script.js', import.meta.url), 'utf8');
const storage = () => Object.defineProperties({}, {
  getItem: { value(key) { return this[key] ?? null; } },
  setItem: { value(key, value) { this[key] = String(value); } },
  removeItem: { value(key) { delete this[key]; } },
});
function harness(local = storage(), remote = new Map()) {
  const hooks = { fail: false, write: null, read: null };
  const context = vm.createContext({ localStorage: local, console: { warn() {} },
    pendingSyncKey: 'app.pendingSync', supabaseUser: { id: 'own-user' }, isHydratingSupabase: false,
    textSizeOptions: { medium: {} }, savedPreferences: {},
    document: { dispatchEvent() {} }, CustomEvent: class {}, window: {}, applyPreferences() {},
    readJson(key, fallback) { try { return JSON.parse(local.getItem(key)) ?? fallback; } catch { return fallback; } },
    supabaseClient: { from(table) { return {
      async upsert(values) {
        if (hooks.write) await hooks.write(values);
        if (hooks.fail) return { error: { message: 'Offline' } };
        if (table === 'user_app_state') for (const row of Array.isArray(values) ? values : [values]) {
          assert.equal(row.user_id, 'own-user'); remote.set(row.state_key, row.payload);
        }
        return { error: null };
      },
      select() { return { eq() { return {
        async then(resolve) {
          const rows = [...remote].map(([state_key,payload]) => ({state_key,payload}));
          if (hooks.read) await hooks.read();
          return resolve({data: rows, error: null});
        }, async maybeSingle() { return {data: null}; },
      }; } }; },
    }; } },
  });
  vm.runInContext(source.slice(source.indexOf('function parseStoredValue('), source.indexOf('function setAuthFeedback(')), context);
  vm.runInContext(source.slice(source.indexOf('async function hydrateSupabaseState('), source.indexOf('async function handleSupabaseSession(')), context);
  const start = source.indexOf('  setPreference(type, value) {');
  const end = source.indexOf('\n  },\n};', start);
  vm.runInContext(source.slice(start,end).replace('setPreference(type, value) {', 'function choose(type, value) {')+'\n}', context);
  return { context, local, remote, hooks, choose: value => context.choose('hapticsStrength',value) };
}
const payload = value => ({__localState:true,raw:false,value});
const settled = h => h.context.syncPendingState();
test('an existing local vibration choice survives stale cloud hydration and is uploaded', async () => {
  const h = harness();h.local.setItem('brother.hapticsStrength','4');h.remote.set('brother.hapticsStrength',payload(1));
  await h.context.hydrateSupabaseState();
  assert.equal(h.local.getItem('brother.hapticsStrength'),'4');assert.equal(h.remote.get('brother.hapticsStrength').value,4);
});
test('offline choice remains queued across restart and is retried before cloud hydration', async () => {
  const h = harness();h.hooks.fail=true;h.remote.set('brother.hapticsStrength',payload(1));h.choose('5');await settled(h);
  assert.ok(h.context.getPendingSyncKeys().has('brother.hapticsStrength'));
  const restarted=harness(h.local,h.remote);await settled(restarted);await restarted.context.hydrateSupabaseState();
  assert.equal(restarted.local.getItem('brother.hapticsStrength'),'5');assert.equal(restarted.remote.get('brother.hapticsStrength').value,5);
  assert.equal(restarted.context.getPendingSyncKeys().size,0);
});
test('rapid choices are serialized and the final level wins over a slow first write', async () => {
  const h=harness();let release;let started;
  const began=new Promise(r=>{started=r;});
  h.hooks.write=()=>new Promise(r=>{release=r;started();});
  h.choose('2');await began;h.choose('4');h.choose('5');h.hooks.write=null;release();await settled(h);
  assert.equal(h.remote.get('brother.hapticsStrength').value,5);assert.equal(h.local.getItem('brother.hapticsStrength'),'5');
  assert.equal(h.context.getPendingSyncKeys().size,0);
});
test('a new device restores Off from cloud and keeps it after reload', async () => {
  const h=harness();h.remote.set('brother.hapticsStrength','off');await h.context.hydrateSupabaseState();
  assert.equal(h.local.getItem('brother.hapticsStrength'),'off');
  const restarted=harness(h.local,h.remote);await restarted.context.hydrateSupabaseState();assert.equal(restarted.local.getItem('brother.hapticsStrength'),'off');
});
test('a choice made while cloud records are loading is preserved and synchronized', async () => {
  const h=harness();h.remote.set('brother.hapticsStrength',payload(1));let release;let started;
  const began=new Promise(r=>{started=r;});h.hooks.read=()=>new Promise(r=>{release=r;started();});
  const loading=h.context.hydrateSupabaseState();await began;h.choose('3');release();await loading;
  assert.equal(h.local.getItem('brother.hapticsStrength'),'3');assert.equal(h.remote.get('brother.hapticsStrength').value,3);
});
