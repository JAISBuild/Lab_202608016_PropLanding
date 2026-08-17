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
          headline: "머무는 방식이 강을 바꿉니다",
          subheadline: "빛, 동선, 나만의 리듬이 머무는 한강 생활권. 가까운 것부터 천천히 확인해 보세요.",
          imageUrl: "/images/hero-apartment-night.jpg",
        },
      },
      {
        campaignId: campaign.id,
        type: "gallery",
        sortOrder: 1,
        payload: {
          title: "사업지 갤러리",
          images: [
            { url: "/images/gallery-aerial.jpg", alt: "단지 조감도" },
            { url: "/images/gallery-community.jpg", alt: "커뮤니티 시설 · 피트니스" },
            { url: "/images/gallery-landscape.jpg", alt: "단지 조경" },
          ],
        },
      },
      {
        campaignId: campaign.id,
        type: "video",
        sortOrder: 2,
        payload: {
          title: "주거 홍보 영상",
          videoUrl: "/videos/promo-living.mp4",
          posterUrl: "/images/life-light.jpg",
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

  await prisma.unitType.upsert({
    where: { campaignId_code: { campaignId: campaign.id, code: "59a" } },
    update: {
      name: "59㎡ A타입",
      areaSqm: 59,
      specs: { rooms: "방 3", baths: "욕실 2", tagline: "컴팩트한 3Bay 판상형", note: "실거주 선호 타입" },
      sortOrder: 0,
    },
    create: {
      campaignId: campaign.id,
      code: "59a",
      name: "59㎡ A타입",
      areaSqm: 59,
      specs: { rooms: "방 3", baths: "욕실 2", tagline: "컴팩트한 3Bay 판상형", note: "실거주 선호 타입" },
      sortOrder: 0,
    },
  });

  const unitA = await prisma.unitType.upsert({
    where: { campaignId_code: { campaignId: campaign.id, code: "84a" } },
    update: {
      name: "84㎡ A타입",
      areaSqm: 84,
      specs: { rooms: "방 3", baths: "욕실 2", tagline: "맞통풍 4Bay 판상형", note: "가장 여유로운 대표 타입" },
      sortOrder: 1,
    },
    create: {
      campaignId: campaign.id,
      code: "84a",
      name: "84㎡ A타입",
      areaSqm: 84,
      specs: { rooms: "방 3", baths: "욕실 2", tagline: "맞통풍 4Bay 판상형", note: "가장 여유로운 대표 타입" },
      sortOrder: 1,
    },
  });

  await prisma.unitType.upsert({
    where: { campaignId_code: { campaignId: campaign.id, code: "101b" } },
    update: {
      name: "101㎡ B타입",
      areaSqm: 101,
      specs: { rooms: "방 3", baths: "욕실 2", tagline: "두 개의 팬트리와 서재", note: "여유 수납 특화 타입" },
      sortOrder: 2,
    },
    create: {
      campaignId: campaign.id,
      code: "101b",
      name: "101㎡ B타입",
      areaSqm: 101,
      specs: { rooms: "방 3", baths: "욕실 2", tagline: "두 개의 팬트리와 서재", note: "여유 수납 특화 타입" },
      sortOrder: 2,
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
