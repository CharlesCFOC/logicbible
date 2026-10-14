import { kidsAdventures, readAdventureProgress } from './kids-adventures-data.js';

const validIds = new Set(kidsAdventures.map(a => a.id));
const prefix = 'kids.badges.cache.v1.';
const clean = rows => Object.fromEntries((Array.isArray(rows) ? rows : []).filter(r => validIds.has(r?.adventureId) && typeof r.earnedAt === 'string' && Number.isFinite(Date.parse(r.earnedAt))).map(r => [r.adventureId, { adventureId: r.adventureId, earnedAt: r.earnedAt }]));

export function createKidsBadgeStore(bridge, storage = window.localStorage) {
  const memory = new Map();
  const listeners = new Set();
  const read = key => { try { return memory.has(key) ? memory.get(key) : storage.getItem(key); } catch { return memory.get(key) || null; } };
  const write = (key, value) => { memory.set(key, value); try { storage.setItem(key, value); } catch { /* Session copy remains usable. */ } };
  const load = scope => { try { return clean(JSON.parse(read(prefix + scope))); } catch { return {}; } };
  const persist = (scope, records) => write(prefix + scope, JSON.stringify(Object.values(records)));
  let snapshot = { userId: null, records: [], status: 'guest' };
  let running;
  let runningScope;
  let revision = 0;
  const emit = (scope, records, status) => {
    snapshot = { userId: scope === 'guest' ? null : scope, records: Object.values(records).sort((a, b) => b.earnedAt.localeCompare(a.earnedAt)), status };
    listeners.forEach(listener => listener());
  };
  const scopeNow = () => bridge?.getUserId() || 'guest';
  const local = scope => {
    let records = load(scope);
    if (!read('kids.badges.legacyMigrated')) {
      for (const a of kidsAdventures) if (readAdventureProgress(a.id, storage).completed && !records[a.id]) records[a.id] = { adventureId: a.id, earnedAt: new Date().toISOString() };
      persist(scope, records);
      write('kids.badges.legacyMigrated', 'true');
    }
    if (scope !== 'guest') {
      const guest = load('guest');
      if (Object.keys(guest).length) {
        records = { ...guest, ...records };
        persist(scope, records);
        persist('guest', {});
      }
    }
    return records;
  };
  emit(scopeNow(), local(scopeNow()), scopeNow() === 'guest' ? 'guest' : 'loading');

  const sync = () => {
    const scope = scopeNow();
    if (running && runningScope === scope) return running;
    const token = ++revision;
    runningScope = scope;
    const records = local(scope);
    emit(scope, records, scope === 'guest' ? 'guest' : 'loading');
    if (scope === 'guest') { running = null; return Promise.resolve(); }
    const task = (async () => {
      try {
        const remote = clean(await bridge.load());
        if (token !== revision || scopeNow() !== scope) return;
        // Include awards earned while this request was in flight.
        const combined = { ...load(scope), ...remote };
        persist(scope, combined);
        for (const record of Object.values(combined)) {
          if (!remote[record.adventureId]) await bridge.save(record.adventureId, record.earnedAt);
          if (token !== revision || scopeNow() !== scope) return;
        }
        emit(scope, { ...combined, ...load(scope) }, 'synced');
      } catch {
        if (token === revision && scopeNow() === scope) emit(scope, load(scope), 'pending');
      }
    })();
    running = task;
    task.finally(() => { if (running === task) running = null; });
    return task;
  };
  const earn = async adventureId => {
    if (!validIds.has(adventureId)) return;
    const scope = scopeNow();
    const records = local(scope);
    records[adventureId] ||= { adventureId, earnedAt: new Date().toISOString() };
    persist(scope, records);
    emit(scope, records, scope === 'guest' ? 'guest' : 'loading');
    // Wait for an earlier hydration, then flush this award too.
    if (running && runningScope === scope) await running;
    if (scopeNow() === scope) await sync();
  };
  return { getSnapshot: () => snapshot, subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); }, sync, earn };
}
