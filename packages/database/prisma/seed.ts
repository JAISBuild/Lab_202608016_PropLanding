import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: "demo-org" },
    update: {},
    create: { name: "데모 분양", slug: "demo-org" },
  });

  const template = await prisma.siteTemplate.upsert({
    where: { id: "default-template" },
    update: {},
    create: {
      id: "default-template",
      layoutKey: "proplanding-v1",
      version: "1",
      name: "PropLanding 기본 템플릿",
    },
  });

  const previewToken = "preview-demo-token";

  const campaign = await prisma.campaign.upsert({
    where: {
      organizationId_slug: { organizationId: org.id, slug: "riverside" },
    },
    update: {},
    create: {
      organizationId: org.id,
      siteTemplateId: template.id,
      slug: "riverside",
      title: "리버사이드 힐스",
      status: "published",
      contactPhone: "1588-0000",
      previewToken,
      publishedAt: new Date(),
      meta: {
        description: "한강 뷰 프리미엄 분양",
        ogTitle: "리버사이드 힐스",
      },
    },
  });

  await prisma.siteBlock.deleteMany({ where: { campaignId: campaign.id } });
  await prisma.siteBlock.createMany({
    data: [
      {
        campaignId: campaign.id,
        type: "hero",
        sortOrder: 0,
        payload: {
          headline: "한강이 보이는 프리미엄 라이프",
          subheadline: "리버사이드 힐스 · 선착순 분양",
          imageUrl: "https://picsum.photos/seed/hero-riverside/1920/1080",
        },
      },
      {
        campaignId: campaign.id,
        type: "gallery",
        sortOrder: 1,
        payload: {
          title: "사업지 갤러리",
          images: [
            { url: "https://picsum.photos/seed/gallery1/1200/800", alt: "조감도" },
            { url: "https://picsum.photos/seed/gallery2/1200/800", alt: "커뮤니티" },
            { url: "https://picsum.photos/seed/gallery3/1200/800", alt: "조경" },
          ],
        },
      },
      {
        campaignId: campaign.id,
        type: "video",
        sortOrder: 2,
        payload: {
          title: "홍보 영상",
          videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
          posterUrl: "https://picsum.photos/seed/video-poster/1280/720",
        },
      },
      {
        campaignId: campaign.id,
        type: "raw_text",
        sortOrder: 3,
        payload: {
          title: "분양 혜택",
          body: "계약금 10% · 중도금 무이자 · 4대 Appliance 제공",
        },
      },
    ],
  });

  const unitA = await prisma.unitType.upsert({
    where: { campaignId_code: { campaignId: campaign.id, code: "84a" } },
    update: {},
    create: {
      campaignId: campaign.id,
      code: "84a",
      name: "84㎡ A타입",
      areaSqm: 84,
      specs: { rooms: "3룸", direction: "남향" },
      sortOrder: 0,
    },
  });

  await prisma.unitType.upsert({
    where: { campaignId_code: { campaignId: campaign.id, code: "101b" } },
    update: {},
    create: {
      campaignId: campaign.id,
      code: "101b",
      name: "101㎡ B타입",
      areaSqm: 101,
      specs: { rooms: "4룸", direction: "남동향" },
      sortOrder: 1,
    },
  });

  await prisma.unitTypeMedia.deleteMany({ where: { unitTypeId: unitA.id } });
  // floorplan uses demo path
  const floorMedia = await prisma.mediaAsset.create({
    data: {
      organizationId: org.id,
      storageKey: "demo/floor-84a.png",
      mimeType: "image/png",
      fileName: "floor-84a.png",
      fileSize: 0,
      altText: "84㎡ A타입 평면도",
    },
  });
  await prisma.unitTypeMedia.create({
    data: { unitTypeId: unitA.id, mediaId: floorMedia.id, purpose: "floorplan" },
  });

  const privacy = await prisma.legalNotice.upsert({
    where: {
      organizationId_type_version: {
        organizationId: org.id,
        type: "privacy",
        version: "1.0",
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      type: "privacy",
      version: "1.0",
      title: "개인정보 수집·이용 동의",
      content:
        "수집 항목: 이름, 연락처. 목적: 분양 상담. 보유 기간: 상담 종료 후 1년.",
    },
  });

  await prisma.campaignLegalNotice.upsert({
    where: { id: "demo-legal-link" },
    update: {},
    create: {
      id: "demo-legal-link",
      campaignId: campaign.id,
      legalNoticeId: privacy.id,
    },
  });

  const staff = await prisma.staffMember.upsert({
    where: { id: "demo-staff" },
    update: {},
    create: {
      id: "demo-staff",
      organizationId: org.id,
      name: "김상담",
      email: "agent@demo.local",
      phone: "010-0000-0000",
    },
  });

  await prisma.role.upsert({
    where: { name: "owner" },
    update: {},
    create: { name: "owner" },
  });
  await prisma.role.upsert({
    where: { name: "manager" },
    update: {},
    create: { name: "manager" },
  });
  await prisma.role.upsert({
    where: { name: "agent" },
    update: {},
    create: { name: "agent" },
  });

  const ownerRole = await prisma.role.findUniqueOrThrow({ where: { name: "owner" } });
  const passwordHash = await bcrypt.hash("admin1234", 10);

  const admin = await prisma.adminUser.upsert({
    where: { email: "admin@demo.local" },
    update: {},
    create: {
      organizationId: org.id,
      staffMemberId: staff.id,
      email: "admin@demo.local",
      passwordHash,
      name: "관리자",
    },
  });

  await prisma.adminUserRole.upsert({
    where: { adminUserId_roleId: { adminUserId: admin.id, roleId: ownerRole.id } },
    update: {},
    create: { adminUserId: admin.id, roleId: ownerRole.id },
  });

  await prisma.marketingSource.upsert({
    where: { code: "naver" },
    update: {},
    create: { code: "naver", name: "네이버" },
  });

  console.log("Seed complete:");
  console.log("  Campaign: /c/riverside");
  console.log("  Preview:  /c/riverside?preview=preview-demo-token");
  console.log("  Admin:    admin@demo.local / admin1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
