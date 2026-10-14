import { createClient } from '@supabase/supabase-js';

const channelName = 'intercession-live';
const endpoint = path => globalThis.window?.apiUrl?.(path) || path;
const presenceKey = () => {
  const storageKey = 'intercession.presence-key.v1';
  try {
    const existing = localStorage.getItem(storageKey);
    if (existing) return existing;
    const next = globalThis.crypto?.randomUUID?.() || `guest-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(storageKey, next);
    return next;
  } catch {
    return `guest-${Math.random().toString(36).slice(2)}`;
  }
};

export async function createIntercessionPresence(onChange) {
  const response = await fetch(endpoint('/api/supabase/config'));
  const config = await response.json();
  if (!response.ok || !config.configured || !config.url || !config.anonKey) throw new Error('Live presence is unavailable.');
  const client = createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const channel = client.channel(channelName, { config: { presence: { key: presenceKey() } } });
  const emitCount = () => onChange({ connected: true, count: Object.keys(channel.presenceState()).length });
  channel.on('presence', { event: 'sync' }, emitCount).subscribe(async status => {
    if (status !== 'SUBSCRIBED') return;
    await channel.track({ joinedAt: new Date().toISOString() });
    emitCount();
  });
  return () => { client.removeChannel(channel); };
}
