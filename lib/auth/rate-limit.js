const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export function isRateLimited(key) {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now - entry.startedAt > WINDOW_MS) {
    attempts.set(key, { startedAt: now, count: 1 });
    return false;
  }

  entry.count += 1;
  attempts.set(key, entry);
  return entry.count > MAX_ATTEMPTS;
}

export function resetRateLimit(key) {
  attempts.delete(key);
}
