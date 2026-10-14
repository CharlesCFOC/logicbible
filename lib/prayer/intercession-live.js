import { createClient } from '@supabase/supabase-js';

const channelName = 'intercession-live';
const endpoint = path => globalThis.window?.apiUrl?.(path) || path;
const countriesByTimeZone = {
  'America/Toronto': 'CA', 'America/Montreal': 'CA', 'America/Vancouver': 'CA', 'America/Edmonton': 'CA', 'America/Winnipeg': 'CA', 'America/Halifax': 'CA', 'America/St_Johns': 'CA', 'America/Regina': 'CA', 'America/Yellowknife': 'CA', 'America/Whitehorse': 'CA',
  'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US', 'America/Los_Angeles': 'US', 'America/Phoenix': 'US', 'America/Anchorage': 'US', 'Pacific/Honolulu': 'US',
  'Europe/London': 'GB', 'Europe/Paris': 'FR', 'Europe/Berlin': 'DE', 'Europe/Rome': 'IT', 'Europe/Madrid': 'ES', 'Europe/Amsterdam': 'NL', 'Europe/Zurich': 'CH', 'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO', 'Europe/Copenhagen': 'DK',
  'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR', 'Asia/Kolkata': 'IN', 'Asia/Dubai': 'AE', 'Asia/Singapore': 'SG', 'Asia/Bangkok': 'TH', 'Asia/Manila': 'PH', 'Asia/Jakarta': 'ID', 'Asia/Jerusalem': 'IL',
  'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Brisbane': 'AU', 'Australia/Perth': 'AU', 'Pacific/Auckland': 'NZ', 'America/Sao_Paulo': 'BR', 'America/Mexico_City': 'MX', 'Africa/Johannesburg': 'ZA', 'Africa/Nairobi': 'KE',
};
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

async function getCountryCode() {
  try {
    const response = await fetch(endpoint('/api/prayer/intercession-location'), { cache: 'no-store' });
    if (response.ok) {
      const { countryCode } = await response.json();
      if (/^[A-Z]{2}$/.test(countryCode || '')) return countryCode;
    }
  } catch {}
  const locales = [...(globalThis.navigator?.languages || []), globalThis.navigator?.language].filter(Boolean);
  for (const locale of locales) {
    try {
      const region = new Intl.Locale(locale).region;
      if (/^[A-Z]{2}$/.test(region || '')) return region;
    } catch {}
  }
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return countriesByTimeZone[timeZone] || null;
}

export async function createIntercessionPresence(onChange) {
  const [response, countryCode] = await Promise.all([
    fetch(endpoint('/api/supabase/config')),
    getCountryCode(),
  ]);
  const config = await response.json();
  if (!response.ok || !config.configured || !config.url || !config.anonKey) throw new Error('Live presence is unavailable.');
  const client = createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const channel = client.channel(channelName, { config: { presence: { key: presenceKey() } } });
  const emitCount = () => {
    const presence = channel.presenceState();
    const countryCodes = [...new Set(Object.values(presence).flat().map(entry => entry?.countryCode).filter(code => /^[A-Z]{2}$/.test(code || '')))];
    onChange({ connected: true, count: Object.keys(presence).length, countryCodes });
  };
  channel.on('presence', { event: 'sync' }, emitCount).subscribe(async status => {
    if (status !== 'SUBSCRIBED') return;
    await channel.track({ joinedAt: new Date().toISOString(), countryCode });
    emitCount();
  });
  return () => { client.removeChannel(channel); };
}
