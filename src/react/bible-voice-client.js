function apiBase() {
  const native = window.Capacitor?.isNativePlatform?.()
    || ["android", "ios"].includes(window.Capacitor?.getPlatform?.())
    || (window.location.hostname === "localhost" && !window.location.port);
  return native ? "https://logicbible.vercel.app" : "";
}

async function voiceRequest(path, body, signal) {
  const base = apiBase();
  const configResponse = await fetch(`${base}/api/supabase/config`, { signal });
  const config = await configResponse.json().catch(() => null);
  if (!configResponse.ok || !config?.configured) throw new Error("La transcription IA est indisponible.");
  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient(config.url, config.anonKey, { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } });
  const { data, error } = await client.auth.getSession();
  const token = data?.session?.access_token;
  if (error || !token) throw new Error("Connectez-vous pour utiliser la reconnaissance vocale par IA.");

  const response = await fetch(`${base}${path}`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload) throw new Error(payload?.error || "La transcription IA a échoué. Réessayez.");
  return payload;
}

export async function requestBibleVoiceTranscript(blob, { signal } = {}) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  const payload = await voiceRequest("/api/ai/bible-voice-transcribe", {audioBase64:btoa(binary),mimeType:blob.type || "audio/webm"}, signal);
  return String(payload.text || "").trim();
}
export function requestBibleVoiceSearch(query, { signal } = {}) {
  return voiceRequest("/api/ai/bible-voice-search", {query}, signal);
}
