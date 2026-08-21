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
          headline: "한강이 가까운 하루가 달라집니다",
          subheadline: "빛, 동선, 나만의 리듬이 머무는 한강 생활권. 가까운 것부터 천천히 확인해 보세요.",
          imageUrl: "/images/hero-apartment-dusk.jpg",
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
            { url: "/images/gallery-courtyard.jpg", alt: "단지 조경" },
          ],
        },
      },
      {
        campaignId: campaign.id,
        type: "video",
        sortOrder: 2,
        payload: {
          title: "주거 홍보 영상",
          videoUrl: "/videos/promo-living.mp4?v=20260822",
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
      {
        campaignId: campaign.id,
        type: "faq",
        sortOrder: 4,
        payload: {
          headline: "알고 싶은 것부터 확인하세요.",
          items: [
            {
              q: "방문 상담은 얼마나 걸리나요?",
              a: "보통 30–40분입니다. 관심 타입을 미리 고르시면 평면과 동선을 중심으로 더 편하게 안내합니다.",
            },
            {
              q: "계약금·중도금은 어떻게 되나요?",
              a: "캠페인마다 조건이 다릅니다. 상담 시 현재 적용 중인 계약금 비율과 중도금 일정을 명확히 말씀드립니다.",
            },
            {
              q: "관심 타입은 나중에 바꿔도 되나요?",
              a: "가능합니다. 예약 단계에서 고른 타입은 상담 우선순위일 뿐, 계약 전까지 언제든 다시 비교할 수 있습니다.",
            },
            {
              q: "개인정보는 어디에 쓰이나요?",
              a: "방문 안내와 상담 연락에만 사용합니다. 필수 동의 내용을 펼쳐 확인한 뒤 제출해 주세요.",
            },
          ],
        },
      },
      {
        campaignId: campaign.id,
        type: "lifestyle",
        sortOrder: 5,
        payload: {
          headline: "하루를 바꾸는 작은 설계.",
          lightTitle: "빛이 머무는 집의 방향",
          lightBody: "동지일 태양·그림자를 재현합니다. 전체화면에서 동별 일조를 비교하세요.",
          smartTitle: "집 안과 지하가 한 화면.",
          smartBody:
            "월패드로 조명·환기·난방을 보고, 지하에서는 빈 자리와 전기차 충전을 안내합니다.",
          commonTitle: "함께여서 더 편안한 공용부.",
          commonBody: "이웃과 머무는 생활공간, 라운지, 작은 도서관 — 시설이 아니라 하루의 공용부입니다.",
          spaces: [
            { url: "/images/life-living.jpg", caption: "생활공간" },
            { url: "/images/life-lounge.jpg", caption: "라운지" },
            { url: "/images/life-library.jpg", caption: "작은도서관" },
          ],
          sunStudy: {
            latitude: 37.5665,
            longitude: 126.978,
            dongs: [
              { name: "101동", x: -86, z: -238, h: 78, floors: 26, kind: "why", face: 178 },
              { name: "102동", x: -98, z: -128, h: 90, floors: 30, kind: "tee", face: 152 },
              { name: "103동", x: -102, z: -16, h: 96, floors: 32, kind: "why", face: 172 },
              { name: "104동", x: -96, z: 100, h: 84, floors: 28, kind: "tee", face: 150 },
              { name: "105동", x: -78, z: 210, h: 72, floors: 24, kind: "why", face: 180 },
              { name: "106동", x: 8, z: 258, h: 80, floors: 26, kind: "tee", face: 186 },
              { name: "107동", x: 82, z: 202, h: 66, floors: 22, kind: "why", face: 212 },
              { name: "108동", x: 100, z: 94, h: 75, floors: 25, kind: "tee", face: 208 },
              { name: "109동", x: 102, z: -20, h: 88, floors: 29, kind: "why", face: 190 },
              { name: "110동", x: 94, z: -130, h: 81, floors: 27, kind: "tee", face: 205 },
              { name: "111동", x: 76, z: -236, h: 74, floors: 24, kind: "why", face: 176 },
              { name: "112동", x: -6, z: -268, h: 70, floors: 23, kind: "tee", face: 182 },
            ],
          },
        },
      },
    ],
  });

  await prisma.unitType.upsert({
    where: { campaignId_code: { campaignId: campaign.id, code: "59a" } },
    update: {
      name: "59㎡ A타입",
      areaSqm: 59,
      specs: { rooms: "방 3", baths: "욕실 2", tagline: "확장형 4Bay 판상형", note: "실거주 선호 타입" },
      sortOrder: 0,
    },
    create: {
      campaignId: campaign.id,
      code: "59a",
      name: "59㎡ A타입",
      areaSqm: 59,
      specs: { rooms: "방 3", baths: "욕실 2", tagline: "확장형 4Bay 판상형", note: "실거주 선호 타입" },
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
