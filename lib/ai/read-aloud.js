import { getSupabaseAdminClient } from '../supabase/server.js';
import { aiRequestContext, reserveAiCall } from './access.js';

export function normalizeReadAloud(input) {
  if (typeof input?.text !== 'string' || !input.text.trim() || input.text.length > 4000) {
    throw Object.assign(new Error('Choose a text between 1 and 4,000 characters to read aloud.'), { status: 400 });
  }
  if (Buffer.byteLength(input.text, 'utf8') > 5000) {
    throw Object.assign(new Error('This text is too long to read at once. Choose a shorter passage.'), { status: 400 });
  }
  if (input.language !== undefined && !['en', 'fr'].includes(input.language)) {
    throw Object.assign(new Error('Unsupported reading language.'), { status: 400 });
  }
  return { text: input.text.trim(), language: input.language || 'en' };
}

export async function generateReadAloud(input, {
  fetcher = fetch,
  reserve = () => reserveAiCall(getSupabaseAdminClient(), aiRequestContext.getStore()?.actor),
  signal,
} = {}) {
  const { text, language } = normalizeReadAloud(input);
  const key = process.env.GOOGLE_CLOUD_TTS_API_KEY;
  if (!key) throw Object.assign(new Error('Natural voice needs Google Text-to-Speech to be configured.'), { status: 503 });
  await reserve();
  const response = await fetcher('https://texttospeech.googleapis.com/v1/text:synthesize', {
    method: 'POST',
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(90_000)]) : AbortSignal.timeout(90_000),
    headers: { 'X-Goog-Api-Key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text },
      // Lock the voice tier so a caller cannot select a more expensive model.
      voice: language === 'fr'
        ? { languageCode: 'fr-CA', name: 'fr-CA-Neural2-A' }
        : { languageCode: 'en-US', name: 'en-US-Neural2-F' },
      audioConfig: { audioEncoding: 'MP3', speakingRate: 1, pitch: 0 },
    }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if ([401, 403].includes(response.status)) throw Object.assign(new Error('Natural voice is not configured correctly. Check the Google Text-to-Speech API and its key.'), { status: 503 });
    throw Object.assign(new Error(response.status === 429 ? 'Natural voice is busy. Please try again shortly.' : 'Natural voice could not be prepared. Please try again.'), { status: response.status === 429 ? 429 : 502 });
  }
  const data = payload?.audioContent;
  if (typeof data !== 'string' || !data.length || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) {
    throw Object.assign(new Error('The audio is incomplete. Please try again.'), { status: 502 });
  }
  const audio = Buffer.from(data, 'base64');
  if (!audio.length) throw Object.assign(new Error('No audio was returned. Please try again.'), { status: 502 });
  return audio;
}
