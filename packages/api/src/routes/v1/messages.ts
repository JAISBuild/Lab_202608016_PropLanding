import { Hono } from "hono";
import { requireAuth } from "../../middleware/auth";
import type { ApiEnv } from "../../types";
import { getMessageDeliveryStats, listMessageDeliveries } from "../../services/messaging";

const messages = new Hono<ApiEnv>();

messages.use("*", requireAuth);

messages.get("/", async (c) => {
  const auth = c.get("auth");
  const inquiryId = c.req.query("inquiryId");
  const items = await listMessageDeliveries(auth.orgId, {
    inquiryId: inquiryId || undefined,
    limit: 100,
  });
  return c.json({ data: items });
});

messages.get("/stats", async (c) => {
  const auth = c.get("auth");
  const stats = await getMessageDeliveryStats(auth.orgId);
  return c.json({ data: stats });
});

export default messages;
