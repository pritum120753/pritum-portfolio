const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
export function createLoginRateLimiter({
  windowMs = WINDOW_MS,
  maxAttempts = MAX_ATTEMPTS,
  now = Date.now,
} = {}) {
  const requests = new Map();

  return function loginRateLimiter(req, res, next) {
    const key = req.ip || req.socket?.remoteAddress || "unknown";
    const currentTime = now();
    const existing = requests.get(key);

    if (!existing || currentTime >= existing.resetAt) {
      requests.set(key, { count: 1, resetAt: currentTime + windowMs });
      return next();
    }

    if (existing.count >= maxAttempts) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((existing.resetAt - currentTime) / 1000),
      );
      res.set("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({
        success: false,
        message: "Too many login attempts. Please try again later.",
      });
    }

    existing.count += 1;
    return next();
  };
}

export const loginRateLimiter = createLoginRateLimiter();
