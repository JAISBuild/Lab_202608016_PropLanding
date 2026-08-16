export const API_VERSION = "v1" as const;

export type HealthStatus = "ok" | "degraded" | "error";

export interface HealthResponse {
  status: HealthStatus;
  service: string;
  version: string;
  timestamp: string;
}

export interface ReadyResponse {
  status: HealthStatus;
  checks: {
    database: HealthStatus;
  };
  timestamp: string;
}

export function createHealthResponse(
  service: string,
  version: string,
): HealthResponse {
  return {
    status: "ok",
    service,
    version,
    timestamp: new Date().toISOString(),
  };
}

// ── Campaign & Site Factory ──────────────────────────────

export type CampaignStatus = "draft" | "published" | "archived";

export type SiteBlockType =
  | "hero"
  | "gallery"
  | "video"
  | "unit_types"
  | "raw_text"
  | "cta"
  | "faq"
  | "location";

export interface SiteBlockPayload {
  [key: string]: unknown;
}

export interface PublicCampaign {
  id: string;
  slug: string;
  title: string;
  status: CampaignStatus;
  contactPhone: string | null;
  meta: Record<string, unknown> | null;
  blocks: PublicSiteBlock[];
  unitTypes: PublicUnitType[];
  legalNotices: PublicLegalNotice[];
}

export interface PublicSiteBlock {
  id: string;
  type: SiteBlockType;
  sortOrder: number;
  payload: SiteBlockPayload;
}

export interface PublicUnitType {
  id: string;
  code: string;
  name: string;
  areaSqm: number | null;
  specs: Record<string, unknown> | null;
  floorplanUrl: string | null;
}

export interface PublicLegalNotice {
  id: string;
  type: string;
  version: string;
  title: string;
  content: string;
}

// ── Inquiry ──────────────────────────────────────────────

export type InquiryStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "visit_scheduled"
  | "visited"
  | "negotiating"
  | "won"
  | "lost"
  | "spam";

export interface CreateInquiryInput {
  campaignId: string;
  fullName: string;
  phone: string;
  email?: string;
  preferredVisitAt?: string;
  interestedUnitTypeId?: string;
  legalNoticeId: string;
  sessionKey?: string;
  sourceSnapshot?: Record<string, unknown>;
}

// ── Analytics ────────────────────────────────────────────

export type AnalyticsEventName =
  | "session_start"
  | "page_view"
  | "unit_type_view"
  | "media_play"
  | "cta_click"
  | "form_submit";

export interface TrackEventInput {
  campaignId: string;
  eventName: AnalyticsEventName;
  sessionKey?: string;
  properties?: Record<string, unknown>;
}
