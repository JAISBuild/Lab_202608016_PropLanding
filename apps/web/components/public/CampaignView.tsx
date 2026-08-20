"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { PublicCampaign } from "@proplanding/shared";
import { PlHero } from "@/components/public/PlHero";
import { PlRhythm } from "@/components/public/PlRhythm";
import { PlGallery } from "@/components/public/PlGallery";
import { PlLifestyle } from "@/components/public/PlLifestyle";
import { PlVideoBlock } from "@/components/public/PlVideoBlock";
import { PlUnitGrid } from "@/components/public/PlUnitGrid";
import { PlFaq } from "@/components/public/PlFaq";
import { PlStickyCta } from "@/components/public/PlStickyCta";
import { PlInquiryForm } from "@/components/public/PlInquiryForm";
import { PlReserveForm } from "@/components/public/PlReserveForm";
import { PlSiteHeader } from "@/components/public/PlSiteHeader";
import { PlSiteFooter } from "@/components/public/PlSiteFooter";
import { submitInquiry, trackEvent } from "@/lib/api";
import { getSessionKey, getUtmParams } from "@/lib/session";

interface CampaignViewProps {
  campaign: PublicCampaign;
  slug: string;
}

export function CampaignView({ campaign, slug }: CampaignViewProps) {
  const router = useRouter();
  const [modal, setModal] = useState<"reserve" | "register" | null>(null);
  const sessionKey = useCallback(() => getSessionKey(), []);

  useEffect(() => {
    const key = sessionKey();
    const utm = getUtmParams();
    void trackEvent({
      campaignId: campaign.id,
      eventName: "session_start",
      sessionKey: key,
      properties: utm,
    });
    void trackEvent({
      campaignId: campaign.id,
      eventName: "page_view",
      sessionKey: key,
    });
  }, [campaign.id, sessionKey]);

  async function handleInquiry(data: {
    fullName: string;
    phone: string;
    email?: string;
    preferredVisitAt?: string;
    interestedUnitTypeId?: string;
    legalNoticeId: string;
  }) {
    const key = sessionKey();
    await submitInquiry({
      ...data,
      campaignId: campaign.id,
      sessionKey: key,
      sourceSnapshot: getUtmParams(),
    });
    void trackEvent({
      campaignId: campaign.id,
      eventName: "form_submit",
      sessionKey: key,
    });
    router.push(`/c/${slug}/thanks?type=inquiry`);
  }

  const hero = campaign.blocks.find((b) => b.type === "hero");
  const gallery = campaign.blocks.find((b) => b.type === "gallery");
  const video = campaign.blocks.find((b) => b.type === "video");
  const benefit = campaign.blocks.find((b) => b.type === "raw_text");
  const lifestyle = campaign.blocks.find((b) => b.type === "lifestyle");
  const faq = campaign.blocks.find((b) => b.type === "faq");

  return (
    <div className="pl-campaign">
      <PlSiteHeader title={campaign.title} phone={campaign.contactPhone} />
      {hero ? (
        <PlHero
          brandName={campaign.title}
          headline={String(hero.payload.headline ?? "")}
          subheadline={hero.payload.subheadline ? String(hero.payload.subheadline) : undefined}
          imageUrl={hero.payload.imageUrl ? String(hero.payload.imageUrl) : undefined}
        />
      ) : null}
      <PlRhythm />
      {gallery ? (
        <PlGallery
          title={gallery.payload.title ? String(gallery.payload.title) : undefined}
          images={(gallery.payload.images as { url: string; alt: string }[]) ?? []}
          onImageClick={() =>
            void trackEvent({
              campaignId: campaign.id,
              eventName: "cta_click",
              sessionKey: sessionKey(),
              properties: { action: "gallery_zoom" },
            })
          }
        />
      ) : null}
      {campaign.unitTypes.length > 0 ? (
        <PlUnitGrid
          slug={slug}
          units={campaign.unitTypes}
          onUnitClick={(code) =>
            void trackEvent({
              campaignId: campaign.id,
              eventName: "unit_type_view",
              sessionKey: sessionKey(),
              properties: { code },
            })
          }
        />
      ) : null}
      <PlLifestyle payload={lifestyle?.payload as import("./PlLifestyle").LifestylePayload | undefined} />
      {video ? (
        <PlVideoBlock
          title={video.payload.title ? String(video.payload.title) : undefined}
          videoUrl={String(video.payload.videoUrl ?? "")}
          posterUrl={video.payload.posterUrl ? String(video.payload.posterUrl) : undefined}
          onPlay={() =>
            void trackEvent({
              campaignId: campaign.id,
              eventName: "media_play",
              sessionKey: sessionKey(),
            })
          }
        />
      ) : null}
      {benefit ? (
        <section className="pl-benefits">
          <div className="pl-container">
            <p>{String(benefit.payload.title ?? "BENEFIT")}</p>
            <strong>{String(benefit.payload.body ?? "")}</strong>
          </div>
        </section>
      ) : null}
      <PlInquiryForm
        legalNotices={campaign.legalNotices}
        unitTypes={campaign.unitTypes.map((u) => ({ id: u.id, name: u.name, areaSqm: u.areaSqm }))}
        phone={campaign.contactPhone}
        onSubmit={handleInquiry}
      />
      <PlFaq
        headline={faq?.payload.headline ? String(faq.payload.headline) : undefined}
        items={(faq?.payload.items as { q: string; a: string }[] | undefined) ?? undefined}
      />
      <PlSiteFooter title={campaign.title} phone={campaign.contactPhone} />
      <PlStickyCta
        phone={campaign.contactPhone}
        onReserve={() => {
          setModal("reserve");
          void trackEvent({
            campaignId: campaign.id,
            eventName: "cta_click",
            sessionKey: sessionKey(),
            properties: { action: "reserve" },
          });
        }}
        onRegister={() => {
          document.getElementById("pl-section-inquiry")?.scrollIntoView({ behavior: "smooth" });
          void trackEvent({
            campaignId: campaign.id,
            eventName: "cta_click",
            sessionKey: sessionKey(),
            properties: { action: "register" },
          });
        }}
      />
      {modal === "reserve" && (
        <div className="pl-modal" role="dialog">
          <div className="pl-modal__backdrop" onClick={() => setModal(null)} />
          <div className="pl-modal__content">
            <button type="button" className="pl-modal__close" onClick={() => setModal(null)}>
              ✕
            </button>
            <PlReserveForm
              legalNotices={campaign.legalNotices}
              onSubmit={async (data) => {
                await handleInquiry({
                  ...data,
                  legalNoticeId: data.legalNoticeId,
                });
                setModal(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
