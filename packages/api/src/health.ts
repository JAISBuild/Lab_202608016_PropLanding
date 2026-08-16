import { prisma } from "@proplanding/database";
import type { HealthStatus, ReadyResponse } from "@proplanding/shared";

export async function checkDatabase(): Promise<HealthStatus> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return "ok";
  } catch {
    return "error";
  }
}

export async function getReadyResponse(): Promise<ReadyResponse> {
  const database = await checkDatabase();
  const status: HealthStatus = database === "ok" ? "ok" : "error";

  return {
    status,
    checks: { database },
    timestamp: new Date().toISOString(),
  };
}
