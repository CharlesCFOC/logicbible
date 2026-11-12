const prefix = 'brother.churchTeams.v1.';
const publicOrigin = 'https://logicbible.vercel.app';
function apiBase() {
  const native = window.Capacitor?.isNativePlatform?.() || ['android', 'ios'].includes(window.Capacitor?.getPlatform?.()) || (location.hostname === 'localhost' && !location.port);
  return native ? publicOrigin : '';
}
export function competitionLink(room, admin = false) {
  // Invitations must work on another device, including when made on localhost.
  const url = new URL('/evangelism-pilot.html', publicOrigin);
  url.searchParams.set('room', room);
  if (admin) url.searchParams.set('admin', '1');
  return url.toString();
}
export function competitionOrganizerPath(room) {
  // Stay on the creator's origin so their saved organizer access is retained.
  return `/evangelism-pilot.html?${new URLSearchParams({ room, admin: '1' })}`;
}
export function readCreatedCompetition(scenarioId, now = Date.now()) {
  try {
    const room = JSON.parse(localStorage.getItem(`brother.churchTeams.created.${scenarioId}`) || 'null');
    return typeof room?.id === 'string' && room.id && room.expiresAt > now ? room : null;
  } catch { return null; }
}
export function saveCreatedCompetition(scenarioId, room) {
  try {
    const key = `brother.churchTeams.created.${scenarioId}`;
    if (room) localStorage.setItem(key, JSON.stringify({ id: room.id, expiresAt: room.expiresAt }));
    else localStorage.removeItem(key);
  } catch { /* The open page still retains organizer access. */ }
}
export function readCompetitionAccess(room, role) {
  try { return JSON.parse(localStorage.getItem(`${prefix}${room}.${role}`) || 'null')?.token || ''; } catch { return ''; }
}
export function saveCompetitionAccess(room, role, token) {
  try { localStorage.setItem(`${prefix}${room}.${role}`, JSON.stringify({ token })); return true; } catch { return false; }
}
export function forgetCompetitionAccess(room, role) {
  try { localStorage.removeItem(`${prefix}${room}.${role}`); } catch { /* An inaccessible store has no reusable credential. */ }
}
export async function competitionRequest({ room, action, token, signal, timeoutMs = 10000, ...body }, fetcher = fetch) {
  const url = `${apiBase()}/api/church/competition${action ? '' : `?room=${encodeURIComponent(room)}`}`;
  const response = await fetcher(url, {
    method: action ? 'POST' : 'GET', signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs), cache: 'no-store',
    headers: { ...(action ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(action ? { body: JSON.stringify({ ...body, action, room }) } : {}),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw Object.assign(new Error(data?.error || 'The session could not be reached. Check your connection.'), { status: response.status });
  return data;
}
export async function createSharedCompetition(scenario, password, { fetcher = fetch, makeAuthClient } = {}) {
  const response = await fetcher(`${apiBase()}/api/supabase/config`);
  const config = await response.json();
  if (!response.ok || !config.configured) throw new Error('Shared sessions are currently unavailable.');
  const createClient = makeAuthClient || (await import('@supabase/supabase-js')).createClient;
  const client = createClient(config.url, config.anonKey, { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } });
  const { data, error } = await client.auth.getSession();
  if (error || !data?.session?.access_token) throw new Error('Sign in to Think Bible to share a session.');
  const room = await competitionRequest({ action: 'create', scenario, password, token: data.session.access_token }, fetcher);
  saveCompetitionAccess(room.id, 'host', room.token);
  return room;
}
