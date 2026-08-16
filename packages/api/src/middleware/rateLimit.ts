import type { Context, Next } from "hono";

const hits = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000;
const MAX_HITS = 120;

export async function rateLimit(c: Context, next: Next) {
  const ip = c.req.header("x-forwarded-for") ?? "local";
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count += 1;
    if (entry.count > MAX_HITS) {
      return c.json({ error: "Too many requests" }, 429);
    }
  }

  await next();
}
