import { Hono } from "hono";
import { getCampaignBySlug } from "../../services/campaigns";

const publicRoutes = new Hono();

publicRoutes.get("/campaigns/:slug", async (c) => {
  const preview = c.req.query("preview");
  const campaign = await getCampaignBySlug(c.req.param("slug"), {
    previewToken: preview,
  });
  if (!campaign) return c.json({ error: "Campaign not found" }, 404);
  return c.json({ data: campaign });
});

export default publicRoutes;
