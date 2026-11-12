import { pilotReactionPrompt } from "../shared/evangelism-pilot.js";
import { normalizeChurchSettings, restoreChurchScenario } from "../shared/church-scenario.js";

export async function requestReadAloud(text, { language = 'en', signal, fetcher = fetch, createAuthClient } = {}) {
  const response = await fetcher('/api/supabase/config', { signal });
  const config = await response.json();
  if (!response.ok || !config.configured) throw new Error('Natural voice is currently unavailable.');
  const makeClient = createAuthClient || (await import('@supabase/supabase-js')).createClient;
  const client = makeClient(config.url, config.anonKey, { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } });
  const { data, error } = await client.auth.getSession();
  if (error || !data?.session?.access_token) throw new Error('Sign in to Think Bible to use the natural voice.');
  const result = await fetcher('/api/ai/read-aloud', {
    method: 'POST', signal,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
    body: JSON.stringify({ text, language }),
  });
  if (!result.ok) {
    const payload = await result.json().catch(() => null);
    throw new Error(payload?.error || 'Natural voice could not be prepared. Please try again.');
  }
  if (!result.headers.get('content-type')?.startsWith('audio/')) throw new Error('No audio was returned. Please try again.');
  return result.blob();
}

export async function requestChurchScenario(settings, { signal, fetcher = fetch, createAuthClient } = {}) {
  const body = normalizeChurchSettings(settings);
  const response = await fetcher("/api/supabase/config", { signal });
  const config = await response.json();
  if (!response.ok || !config.configured) throw new Error("AI generation is currently unavailable.");
  const makeClient = createAuthClient || (await import("@supabase/supabase-js")).createClient;
  const client = makeClient(config.url, config.anonKey, { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } });
  const { data, error } = await client.auth.getSession();
  if (error || !data?.session?.access_token) throw Object.assign(new Error("Sign in to Think Bible to generate your scenario."), { status: 401 });
  const result = await fetcher("/api/ai/church-scenario", {
    method: "POST", signal, headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` }, body: JSON.stringify(body),
  });
  const payload = await result.json().catch(() => null);
  if (!result.ok) throw Object.assign(new Error(payload?.error || "The scenario could not be created. Try again."), { status: result.status });
  return restoreChurchScenario(payload?.scenario);
}

// Only loaded when the facilitator explicitly asks for an AI reaction.
export async function requestPilotReaction(state, { signal, fetcher = fetch, createAuthClient } = {}) {
  const prompt = pilotReactionPrompt(state);
  if (!prompt) throw new Error("Confirm a group response first.");
  const configResponse = await fetcher("/api/supabase/config", { signal });
  const config = await configResponse.json();
  if (!configResponse.ok || !config.configured) throw new Error("AI is unavailable. You can still use the prepared reaction.");
  const makeClient = createAuthClient || (await import("@supabase/supabase-js")).createClient;
  const client = makeClient(config.url, config.anonKey, { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } });
  const { data, error } = await client.auth.getSession();
  const token = data?.session?.access_token;
  if (error || !token) throw Object.assign(new Error("Sign in to the app to use AI. You can continue with the prepared reaction."), { status: 401 });
  const response = await fetcher("/api/ai/chat", {
    method: "POST", signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ prompt, history: [], mode: "chat", audience: "adult" }),
  });
  const payload = await response.json().catch(() => null);
  if (response.status === 401) throw Object.assign(new Error("Your session has expired. The prepared reaction is still available."), { status: 401 });
  if (!response.ok || !payload?.text || payload.incomplete) throw new Error("The AI reaction could not be retrieved. Continue with the prepared reaction.");
  return String(payload.text).trim().slice(0, 420);
}
