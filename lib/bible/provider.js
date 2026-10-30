

const apiBase = "https://rest.api.bible/v1";

export function getApiKey() {
  return process.env.API_BIBLE_KEY || process.env.BIBLE_API_KEY || "";
}

export async function apiBible(path, params = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    const error = new Error("Missing API_BIBLE_KEY in .env.local");
    error.status = 401;
    throw error;
  }

  const url = new URL(`${apiBase}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url, {
    headers: { "api-key": apiKey },
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.message || `API.Bible returned ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return payload;
}
