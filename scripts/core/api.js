// Legacy core/api: loaded before script.js; declarations only.
// Shared state remains in script.js during the incremental React migration.

function apiUrl(path) {
  // Resolve on every call: Capacitor's bridge may initialize after this script.
  const native = window.Capacitor?.isNativePlatform?.()
    || ["android", "ios"].includes(window.Capacitor?.getPlatform?.())
    || (window.location.hostname === "localhost" && !window.location.port);
  return `${native ? "https://logicbible.vercel.app" : ""}${path}`;
}

async function aiFetch(url, options = {}) {
  const { data, error } = supabaseClient
    ? await supabaseClient.auth.getSession()
    : { data: null };
  const token = data?.session?.access_token;
  if (error || !token) throw new Error("Sign in to use AI features.");
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return fetch(url, { ...options, headers });
}

async function readQuizResponse(response) {
  const result = await response.json().catch(() => null);
  if (!response.ok || !result) {
    throw new Error(result?.error || "The quiz service could not be reached. Please try again shortly.");
  }
  return result;
}
