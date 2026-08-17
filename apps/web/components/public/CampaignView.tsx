"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { PublicCampaign } from "@proplanding/shared";
import { PlHero } from "@/components/public/PlHero";
import { PlGallery } from "@/components/public/PlGallery";
import { PlVideoBlock } from "@/components/public/PlVideoBlock";
import { PlUnitGrid } from "@/components/public/PlUnitGrid";
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

  return (
    <div className="pl-campaign">
      <PlSiteHeader title={campaign.title} phone={campaign.contactPhone} />
      {campaign.blocks.map((block) => {
        const p = block.payload;
        switch (block.type) {
          case "hero":
            return (
              <PlHero
                key={block.id}
                brandName={campaign.title}
                headline={String(p.headline ?? "")}
                subheadline={p.subheadline ? String(p.subheadline) : undefined}
                imageUrl={p.imageUrl ? String(p.imageUrl) : undefined}
              />
            );
          case "gallery": {
            const images = (p.images as { url: string; alt: string }[]) ?? [];
            return (
              <PlGallery
                key={block.id}
                title={p.title ? String(p.title) : undefined}
                images={images}
                onImageClick={() =>
                  void trackEvent({
                    campaignId: campaign.id,
                    eventName: "cta_click",
                    sessionKey: sessionKey(),
                    properties: { action: "gallery_zoom" },
                  })
                }
              />
            );
          }
          case "video":
            return (
              <PlVideoBlock
                key={block.id}
                title={p.title ? String(p.title) : undefined}
                videoUrl={String(p.videoUrl ?? "")}
                posterUrl={p.posterUrl ? String(p.posterUrl) : undefined}
                onPlay={() =>
                  void trackEvent({
                    campaignId: campaign.id,
                    eventName: "media_play",
                    sessionKey: sessionKey(),
                  })
                }
              />
            );
          case "raw_text":
            return (
              <section key={block.id} className="pl-section pl-benefits">
                <div className="pl-container pl-benefits__inner">
                  {p.title ? <span className="pl-benefits__eyebrow">{String(p.title)}</span> : null}
                  <p className="pl-benefits__body">{String(p.body ?? "")}</p>
                </div>
              </section>
            );
          default:
            return null;
        }
      })}

      {campaign.unitTypes.length > 0 && (
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
      )}

      <PlInquiryForm
        legalNotices={campaign.legalNotices}
        unitTypes={campaign.unitTypes.map((u) => ({ id: u.id, name: u.name }))}
        onSubmit={handleInquiry}
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
          setModal("register");
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
