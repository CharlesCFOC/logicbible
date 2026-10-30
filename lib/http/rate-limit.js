


export function sessionClientIp(req) {
  return String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").split(",")[0].trim();
}

export function withinRateLimit(store, key, limit, windowMs) {
  const now = Date.now();
  const attempts = (store.get(key) || []).filter(at => now - at < windowMs);
  if (attempts.length >= limit) { store.set(key, attempts); return false; }
  attempts.push(now);
  store.set(key, attempts);
  if (store.size > 5000) for (const [entry, times] of store) if (!times.some(at => now - at < windowMs)) store.delete(entry);
  return true;
}
