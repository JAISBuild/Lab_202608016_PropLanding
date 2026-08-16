import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { loginAdmin, getDashboardStats } from "../../services/auth";
import { listAppointments } from "../../services/assignments";
import { requireAuth } from "../../middleware/auth";
import type { ApiEnv } from "../../types";

const authRoutes = new Hono<ApiEnv>();

authRoutes.post(
  "/login",
  zValidator("json", z.object({ email: z.string().email(), password: z.string().min(6) })),
  async (c) => {
    const body = c.req.valid("json");
    const result = await loginAdmin(body.email, body.password);
    if (!result) return c.json({ error: "Invalid credentials" }, 401);
    return c.json({ data: result });
  },
);

authRoutes.use("/me", requireAuth);
authRoutes.get("/me", async (c) => {
  const auth = c.get("auth");
  return c.json({ data: auth });
});

authRoutes.use("/dashboard", requireAuth);
authRoutes.get("/dashboard", async (c) => {
  const auth = c.get("auth");
  const stats = await getDashboardStats(auth.orgId);
  return c.json({ data: stats });
});

authRoutes.use("/appointments", requireAuth);
authRoutes.get("/appointments", async (c) => {
  const auth = c.get("auth");
  const items = await listAppointments(auth.orgId);
  return c.json({ data: items });
});

export default authRoutes;
