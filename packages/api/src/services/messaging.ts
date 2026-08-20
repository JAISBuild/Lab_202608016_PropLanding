import { prisma } from "@proplanding/database";

export type OutboundChannel = "sms" | "kakao_alimtalk" | "kakao_channel";

type ProviderResult = {
  ok: boolean;
  skipped?: boolean;
  provider: string;
  providerMsgId?: string;
  errorMessage?: string;
};

function messagingMode(): "mock" | "live" {
  const mode = (process.env.MESSAGING_MODE ?? "mock").toLowerCase();
  return mode === "live" ? "live" : "mock";
}

function methodLabel(channel: OutboundChannel): string {
  switch (channel) {
    case "sms":
      return "문자(SMS)";
    case "kakao_alimtalk":
      return "카카오 알림톡";
    case "kakao_channel":
      return "카카오톡 채널";
    default:
      return channel;
  }
}

async function sendSmsLive(to: string, body: string): Promise<ProviderResult> {
  const apiKey = process.env.SMS_API_KEY;
  const apiSecret = process.env.SMS_API_SECRET;
  const sender = process.env.SMS_SENDER;
  if (!apiKey || !apiSecret || !sender) {
    return {
      ok: false,
      skipped: true,
      provider: "sms-env",
      errorMessage: "SMS_API_KEY / SMS_API_SECRET / SMS_SENDER 미설정",
    };
  }
  // 실연동은 벤더(Solapi·NHN·알리고 등)별 HTTP 스펙에 맞게 교체한다.
  // live 모드에서 키가 있으면 요청을 시도하는 자리. 현재는 명시적 stub.
  void to;
  void body;
  return {
    ok: false,
    skipped: true,
    provider: "sms-stub",
    errorMessage: "SMS live 어댑터 미구현 — MESSAGING_MODE=mock 또는 벤더 어댑터 연결 필요",
  };
}

async function sendKakaoLive(
  channel: "kakao_alimtalk" | "kakao_channel",
  to: string,
  body: string,
  templateKey: string,
): Promise<ProviderResult> {
  const restKey = process.env.KAKAO_REST_API_KEY;
  const senderKey = process.env.KAKAO_SENDER_KEY;
  const templateId = process.env.KAKAO_TEMPLATE_INQUIRY_ID ?? templateKey;
  if (!restKey || !senderKey) {
    return {
      ok: false,
      skipped: true,
      provider: "kakao-env",
      errorMessage: "KAKAO_REST_API_KEY / KAKAO_SENDER_KEY 미설정",
    };
  }
  void channel;
  void to;
  void body;
  void templateId;
  return {
    ok: false,
    skipped: true,
    provider: "kakao-stub",
    errorMessage: "카카오 live 어댑터 미구현 — 채널/알림톡 승인 후 어댑터 연결",
  };
}

async function dispatch(
  channel: OutboundChannel,
  to: string,
  body: string,
  templateKey: string,
): Promise<ProviderResult> {
  if (messagingMode() === "mock") {
    return {
      ok: true,
      provider: "mock",
      providerMsgId: `mock_${channel}_${Date.now()}`,
    };
  }
  if (channel === "sms") return sendSmsLive(to, body);
  return sendKakaoLive(channel, to, body, templateKey);
}

function buildInquiryBodies(input: {
  fullName: string;
  campaignTitle: string;
  preferredVisitAt?: Date | null;
  contactPhone?: string | null;
}) {
  const when = input.preferredVisitAt
    ? input.preferredVisitAt.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })
    : "상담 시 조율";
  const phone = input.contactPhone ?? "대표번호";

  const kakaoBody = [
    `[${input.campaignTitle}] 방문 상담 접수 안내`,
    "",
    `${input.fullName}님, 방문 상담 신청이 접수되었습니다.`,
    `희망 일시: ${when}`,
    "",
    "카카오톡 채널에서 일정 확인·변경 안내를 이어가겠습니다.",
    `문의: ${phone}`,
  ].join("\n");

  const smsBody = `[${input.campaignTitle}] ${input.fullName}님 방문상담 접수완료. 희망:${when}. 문의 ${phone}`;

  return { kakaoBody, smsBody };
}

export async function sendInquiryWelcomeMessages(inquiryId: string) {
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    include: {
      campaign: { select: { title: true, contactPhone: true } },
      appointments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!inquiry) return [];

  const { kakaoBody, smsBody } = buildInquiryBodies({
    fullName: inquiry.fullName,
    campaignTitle: inquiry.campaign.title,
    preferredVisitAt: inquiry.preferredVisitAt,
    contactPhone: inquiry.campaign.contactPhone,
  });

  const appointmentId = inquiry.appointments[0]?.id;
  const jobs: Array<{
    channel: OutboundChannel;
    subject: string;
    body: string;
    templateKey: string;
  }> = [
    {
      channel: "kakao_channel",
      subject: "방문 상담 접수 — 카카오톡 채널 안내",
      body: kakaoBody,
      templateKey: "inquiry_welcome_channel",
    },
    {
      channel: "sms",
      subject: "방문 상담 접수 — 문자 안내",
      body: smsBody,
      templateKey: "inquiry_welcome_sms",
    },
  ];

  const results = [];

  for (const job of jobs) {
    const delivery = await prisma.messageDelivery.create({
      data: {
        organizationId: inquiry.organizationId,
        inquiryId: inquiry.id,
        appointmentId,
        channel: job.channel,
        methodLabel: methodLabel(job.channel),
        templateKey: job.templateKey,
        recipient: inquiry.phone,
        subject: job.subject,
        body: job.body,
        status: "pending",
        payload: {
          fullName: inquiry.fullName,
          preferredVisitAt: inquiry.preferredVisitAt?.toISOString() ?? null,
          mode: messagingMode(),
        },
      },
    });

    await prisma.notificationLog.create({
      data: {
        messageDeliveryId: delivery.id,
        event: "queued",
        detail: { channel: job.channel },
      },
    });

    await prisma.notificationLog.create({
      data: {
        messageDeliveryId: delivery.id,
        event: "attempt",
        detail: { at: new Date().toISOString() },
      },
    });

    const result = await dispatch(job.channel, inquiry.phone, job.body, job.templateKey);
    const status = result.skipped ? "skipped" : result.ok ? "sent" : "failed";

    const updated = await prisma.messageDelivery.update({
      where: { id: delivery.id },
      data: {
        status,
        provider: result.provider,
        providerMsgId: result.providerMsgId,
        errorMessage: result.errorMessage,
        sentAt: result.ok ? new Date() : null,
      },
    });

    await prisma.notificationLog.create({
      data: {
        messageDeliveryId: delivery.id,
        event: status,
        detail: {
          provider: result.provider,
          providerMsgId: result.providerMsgId,
          errorMessage: result.errorMessage,
        },
      },
    });

    await prisma.inquiryEvent.create({
      data: {
        inquiryId: inquiry.id,
        type: "message_sent",
        payload: {
          deliveryId: delivery.id,
          channel: job.channel,
          methodLabel: methodLabel(job.channel),
          status,
          subject: job.subject,
        },
      },
    });

    results.push(updated);
  }

  return results;
}

export async function listMessageDeliveries(
  orgId: string,
  options?: { inquiryId?: string; limit?: number },
) {
  return prisma.messageDelivery.findMany({
    where: {
      organizationId: orgId,
      ...(options?.inquiryId ? { inquiryId: options.inquiryId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 50,
    include: {
      inquiry: { select: { id: true, fullName: true, phone: true } },
      logs: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function getMessageDeliveryStats(orgId: string) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [total, sent, failed, recent] = await Promise.all([
    prisma.messageDelivery.count({ where: { organizationId: orgId } }),
    prisma.messageDelivery.count({ where: { organizationId: orgId, status: "sent" } }),
    prisma.messageDelivery.count({ where: { organizationId: orgId, status: "failed" } }),
    prisma.messageDelivery.findMany({
      where: { organizationId: orgId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { inquiry: { select: { fullName: true } } },
    }),
  ]);
  return { total, sent, failed, recent };
}
