import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createHealthResponse } from "@proplanding/shared";
import { getReadyResponse } from "./health";
import { rateLimit } from "./middleware/rateLimit";
import type { ApiEnv } from "./types";
import campaigns from "./routes/v1/campaigns";
import publicRoutes from "./routes/v1/public";
import media from "./routes/v1/media";
import inquiriesPublic from "./routes/v1/inquiries-public";
import inquiriesAdmin from "./routes/v1/inquiries-admin";
import analytics from "./routes/v1/analytics";
import authRoutes from "./routes/v1/auth";

const app = new Hono<ApiEnv>();

app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("/api/*", rateLimit);

app.get("/health", (c) => {
  return c.json(
    createHealthResponse("@proplanding/api", "0.1.0"),
    200,
  );
});

app.get("/ready", async (c) => {
  const ready = await getReadyResponse();
  return c.json(ready, ready.status === "ok" ? 200 : 503);
});

app.get("/", (c) => {
  return c.json({
    name: "PropLanding API",
    version: "0.1.0",
    phase: "1-7",
    endpoints: [
      "/health",
      "/ready",
      "/api/v1/public/campaigns/:slug",
      "/api/v1/campaigns",
      "/api/v1/inquiries",
      "/api/v1/analytics/events",
      "/api/v1/auth/login",
    ],
  });
});

const v1 = new Hono();

v1.route("/public", publicRoutes);
v1.route("/media", media);
v1.route("/inquiries", inquiriesPublic);
v1.route("/campaigns", campaigns);
v1.route("/admin/inquiries", inquiriesAdmin);
v1.route("/analytics", analytics);
v1.route("/auth", authRoutes);

app.route("/api/v1", v1);

const port = Number(process.env.API_PORT ?? 4000);
const host = process.env.API_HOST ?? "0.0.0.0";

if (require.main === module) {
  serve({ fetch: app.fetch, port, hostname: host }, (info) => {
    console.log(`PropLanding API listening on http://${info.address}:${info.port}`);
  });
}

export default app;
