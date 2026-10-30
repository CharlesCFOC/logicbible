import { AsyncLocalStorage } from 'node:async_hooks';
import { createHash } from 'node:crypto';

export const aiRequestContext = new AsyncLocalStorage();
export const authenticatedAiRoutes = new Set([
  '/api/ai/chat', '/api/ai/verse', '/api/ai/chapter-quiz', '/api/ai/apologetics',
  '/api/bible/study', '/api/bible/quiz', '/api/church/study/import',
  '/api/church/study/generate', '/api/church/study/translate',
]);
export async function authenticateAiRequest(req, auth) {
  if (req.method !== 'POST') throw Object.assign(new Error('Use POST for AI requests.'), { status: 405 });
  const match = /^Bearer\s+(\S+)$/i.exec(String(req.headers.authorization || ''));
  if (!match) throw Object.assign(new Error('Sign in to use AI features.'), { status: 401 });
  const { data, error } = await auth().getUser(match[1]);
  if (error || !data?.user) throw Object.assign(new Error('Your session has expired. Please sign in again.'), { status: 401 });
  return `user:${data.user.id}`;
}
export function guestAiActor(req) {
  const ip = process.env.VERCEL ? String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() : req.socket?.remoteAddress;
  return `guest:${createHash('sha256').update(ip || 'unknown').digest('hex')}`;
}
function limit(name, fallback) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(value) || value < 1 || value > 1_000_000) throw new Error(`Invalid ${name}`);
  return value;
}
export async function reserveAiCall(admin, actor) {
  if (!actor) throw Object.assign(new Error('AI request context is unavailable.'), { status: 503 });
  let result;
  try {
    result = await admin.rpc('reserve_ai_call', {
      actor_key: actor,
      hourly_limit: limit('AI_USER_HOURLY_LIMIT', 60),
      daily_limit: limit('AI_USER_DAILY_LIMIT', 200),
      global_daily_limit: limit('AI_GLOBAL_DAILY_LIMIT', 2000),
    });
  } catch { throw Object.assign(new Error('AI usage controls are unavailable. Please try again later.'), { status: 503 }); }
  if (result.error || typeof result.data?.allowed !== 'boolean') {
    throw Object.assign(new Error('AI usage controls are unavailable. Please try again later.'), { status: 503 });
  }
  if (!result.data.allowed) throw Object.assign(new Error('AI usage limit reached. Please try again later.'), {
    status: 429, retryAfter: Math.max(1, Number(result.data.retry_after) || 3600),
  });
}
