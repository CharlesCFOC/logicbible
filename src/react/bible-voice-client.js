function apiBase() {
  const native = window.Capacitor?.isNativePlatform?.()
    || ["android", "ios"].includes(window.Capacitor?.getPlatform?.())
    || (window.location.hostname === "localhost" && !window.location.port);
  return native ? "https://logicbible.vercel.app" : "";
}

export async function requestBibleVoiceTranscript(blob, { signal } = {}) {
  const base = apiBase();
  const configResponse = await fetch(`${base}/api/supabase/config`, { signal });
  const config = await configResponse.json().catch(() => null);
  if (!configResponse.ok || !config?.configured) throw new Error("La transcription IA est indisponible.");
  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient(config.url, config.anonKey, { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } });
  const { data, error } = await client.auth.getSession();
  const token = data?.session?.access_token;
  if (error || !token) throw new Error("Connectez-vous pour utiliser la reconnaissance vocale par IA.");

  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  const response = await fetch(`${base}/api/ai/bible-voice-transcribe`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ audioBase64: btoa(binary), mimeType: blob.type || "audio/webm" }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.text) throw new Error(payload?.error || "La transcription IA a échoué. Réessayez.");
  return String(payload.text).trim();
}
