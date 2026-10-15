const WINDOW_MS = 10 * 60_000;
const MAX_ATTEMPTS = 3;
const attemptsByUser = new Map<string, number[]>();

export function consumeInsightQuota(userId: string, now = Date.now()) {
  const cutoff = now - WINDOW_MS;
  const recent = (attemptsByUser.get(userId) ?? []).filter((timestamp) => timestamp > cutoff);
  if (recent.length >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterSeconds: Math.ceil((recent[0] + WINDOW_MS - now) / 1000) };
  }
  recent.push(now);
  attemptsByUser.set(userId, recent);
  return { allowed: true, retryAfterSeconds: 0 };
}

