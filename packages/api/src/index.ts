import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createHealthResponse } from "@proplanding/shared";
import { getReadyResponse } from "./health";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
  }),
);

app.get("/health", (c) => {
  return c.json(
    createHealthResponse("@proplanding/api", process.env.npm_package_version ?? "0.1.0"),
    200,
  );
});

app.get("/ready", async (c) => {
  const ready = await getReadyResponse();
  const statusCode = ready.status === "ok" ? 200 : 503;
  return c.json(ready, statusCode);
});

app.get("/", (c) => {
  return c.json({
    name: "PropLanding API",
    version: "0.1.0",
    phase: 0,
    endpoints: ["/health", "/ready"],
  });
});

const port = Number(process.env.API_PORT ?? 4000);
const host = process.env.API_HOST ?? "0.0.0.0";

serve({ fetch: app.fetch, port, hostname: host }, (info) => {
  console.log(`PropLanding API listening on http://${info.address}:${info.port}`);
});

export default app;
