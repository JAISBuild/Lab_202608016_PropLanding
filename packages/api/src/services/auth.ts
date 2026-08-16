import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@proplanding/database";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-in-production",
);

export interface AuthPayload {
  sub: string;
  email: string;
  orgId: string;
  name: string;
}

export async function loginAdmin(email: string, password: string) {
  const user = await prisma.adminUser.findUnique({
    where: { email },
    include: { roles: { include: { role: true } } },
  });
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    orgId: user.organizationId,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("8h")
    .sign(JWT_SECRET);

  await prisma.auditLog.create({
    data: {
      adminUserId: user.id,
      action: "login",
      resource: "admin_user",
      resourceId: user.id,
    },
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      orgId: user.organizationId,
      roles: user.roles.map((r) => r.role.name),
    },
  };
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AuthPayload;
  } catch {
    return null;
  }
}

export async function getDashboardStats(orgId: string) {
  const [campaignCount, inquiryCount, newInquiries, appointments] = await Promise.all([
    prisma.campaign.count({ where: { organizationId: orgId, deletedAt: null } }),
    prisma.inquiry.count({ where: { organizationId: orgId } }),
    prisma.inquiry.count({ where: { organizationId: orgId, status: "new" } }),
    prisma.appointment.count({
      where: {
        inquiry: { organizationId: orgId },
        scheduledAt: { gte: new Date() },
        status: "scheduled",
      },
    }),
  ]);

  return { campaignCount, inquiryCount, newInquiries, upcomingAppointments: appointments };
}
