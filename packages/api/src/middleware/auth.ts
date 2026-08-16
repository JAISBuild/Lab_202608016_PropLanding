import type { Context, Next } from "hono";
import { verifyToken, type AuthPayload } from "../services/auth";
import type { ApiEnv } from "../types";

export type { AuthPayload };

export async function requireAuth(c: Context<ApiEnv>, next: Next) {
  const header = c.req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : c.req.query("token");
  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const payload = await verifyToken(token);
  if (!payload) {
    return c.json({ error: "Invalid token" }, 401);
  }
  c.set("auth", payload);
  await next();
}
