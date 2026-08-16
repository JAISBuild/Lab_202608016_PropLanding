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
