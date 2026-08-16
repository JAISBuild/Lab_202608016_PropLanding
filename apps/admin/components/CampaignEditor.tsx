"use client";

import { useState } from "react";
import Link from "next/link";
import {
  getCampaign,
  publishCampaign,
  updateCampaign,
  updateCampaignBlocks,
  type MediaAsset,
  type PublishResult,
} from "@/lib/api";
import { MediaLibrary } from "./MediaLibrary";

type SiteBlock = {
  id?: string;
  type: string;
  sortOrder: number;
  payload: Record<string, unknown>;
};

type Tab = "basic" | "hero" | "gallery" | "media" | "publish";

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";

interface CampaignEditorProps {
  campaignId: string;
  initial: Record<string, unknown>;
  onUpdate: (campaign: Record<string, unknown>) => void;
}

function getBlocks(campaign: Record<string, unknown>): SiteBlock[] {
  return (campaign.siteBlocks as SiteBlock[]) ?? [];
}

function findBlock(blocks: SiteBlock[], type: string): SiteBlock | undefined {
  return blocks.find((b) => b.type === type);
}

function upsertBlock(blocks: SiteBlock[], type: string, sortOrder: number, payload: Record<string, unknown>): SiteBlock[] {
  const rest = blocks.filter((b) => b.type !== type);
  return [...rest, { type, sortOrder, payload }].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function CampaignEditor({ campaignId, initial, onUpdate }: CampaignEditorProps) {
  const [tab, setTab] = useState<Tab>("basic");
  const [campaign, setCampaign] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const slug = campaign.slug as string;
  const previewToken = campaign.previewToken as string;
  const blocks = getBlocks(campaign);
  const heroBlock = findBlock(blocks, "hero");
  const galleryBlock = findBlock(blocks, "gallery");
  const heroPayload = (heroBlock?.payload ?? {}) as Record<string, string | undefined>;
  const galleryPayload = (galleryBlock?.payload ?? {}) as {
    title?: string;
    images?: { url: string; alt: string }[];
  };

  async function reload() {
    const updated = await getCampaign(campaignId);
    setCampaign(updated);
    onUpdate(updated);
  }

  async function saveBasic(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    try {
      await updateCampaign(campaignId, {
        title: String(fd.get("title") ?? ""),
        slug: String(fd.get("slug") ?? ""),
        contactPhone: String(fd.get("contactPhone") ?? "") || undefined,
      });
      await reload();
      setMessage("기본 정보가 저장되었습니다.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  async function saveBlocks(newBlocks: SiteBlock[]) {
    setSaving(true);
    setMessage(null);
    try {
      const updated = await updateCampaignBlocks(campaignId, newBlocks);
      setCampaign(updated);
      onUpdate(updated);
      setMessage("블록이 저장되었습니다.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  function setHeroImage(asset: MediaAsset) {
    const imageUrl = asset.largeUrl || asset.url;
    const newBlocks = upsertBlock(blocks, "hero", 0, {
      ...heroPayload,
      imageUrl,
    });
    void saveBlocks(newBlocks);
  }

  function addGalleryImage(asset: MediaAsset) {
    const images = [...(galleryPayload.images ?? [])];
    images.push({ url: asset.largeUrl || asset.url, alt: asset.altText ?? asset.fileName });
    const newBlocks = upsertBlock(blocks, "gallery", 1, {
      title: galleryPayload.title ?? "갤러리",
      images,
    });
    void saveBlocks(newBlocks);
  }

  function removeGalleryImage(index: number) {
    const images = [...(galleryPayload.images ?? [])];
    images.splice(index, 1);
    const newBlocks = upsertBlock(blocks, "gallery", 1, {
      ...galleryPayload,
      images,
    });
    void saveBlocks(newBlocks);
  }

  async function handlePublish() {
    setSaving(true);
    setMessage(null);
    try {
      const result = await publishCampaign(campaignId);
      setPublishResult(result);
      await reload();
      setMessage("캠페인이 게시되었습니다.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "게시 실패");
    } finally {
      setSaving(false);
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "basic", label: "기본" },
    { id: "hero", label: "히어로" },
    { id: "gallery", label: "갤러리" },
    { id: "media", label: "미디어" },
    { id: "publish", label: "게시" },
  ];

  return (
    <div className="campaign-editor">
      <div className="action-row">
        <Link href={`${WEB_URL}/c/${slug}?preview=${previewToken}`} target="_blank" className="btn-secondary">
          미리보기
        </Link>
        <Link href={`${WEB_URL}/c/${slug}`} target="_blank" className="btn-secondary">
          공개 URL
        </Link>
      </div>

      <nav className="editor-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`editor-tab${tab === t.id ? " is-active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {message && <p className="editor-message">{message}</p>}

      {tab === "basic" && (
        <section className="detail-section">
          <h2>기본 정보</h2>
          <form className="admin-form" onSubmit={(e) => void saveBasic(e)}>
            <label>
              캠페인명
              <input name="title" defaultValue={campaign.title as string} required />
            </label>
            <label>
              Slug
              <input name="slug" defaultValue={slug} pattern="[a-z0-9-]+" required />
            </label>
            <label>
              연락처
              <input name="contactPhone" defaultValue={(campaign.contactPhone as string) ?? ""} />
            </label>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "저장 중…" : "저장"}
            </button>
          </form>
        </section>
      )}

      {tab === "hero" && (
        <section className="detail-section">
          <h2>히어로 섹션</h2>
          <form
            className="admin-form"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const newBlocks = upsertBlock(blocks, "hero", 0, {
                headline: String(fd.get("headline") ?? ""),
                subheadline: String(fd.get("subheadline") ?? ""),
                imageUrl: heroPayload.imageUrl ?? "",
              });
              void saveBlocks(newBlocks);
            }}
          >
            <label>
              헤드라인
              <input name="headline" defaultValue={heroPayload.headline ?? ""} />
            </label>
            <label>
              서브 헤드라인
              <input name="subheadline" defaultValue={heroPayload.subheadline ?? ""} />
            </label>
            {heroPayload.imageUrl ? (
              <div className="hero-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroPayload.imageUrl} alt="Hero" />
              </div>
            ) : (
              <p className="empty">히어로 이미지를 선택하세요 (미디어 탭 또는 아래).</p>
            )}
            <MediaLibrary onSelect={setHeroImage} selectedUrl={heroPayload.imageUrl} />
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "저장 중…" : "텍스트 저장"}
            </button>
          </form>
        </section>
      )}

      {tab === "gallery" && (
        <section className="detail-section">
          <h2>갤러리</h2>
          <form
            className="admin-form"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const newBlocks = upsertBlock(blocks, "gallery", 1, {
                title: String(fd.get("title") ?? ""),
                images: galleryPayload.images ?? [],
              });
              void saveBlocks(newBlocks);
            }}
          >
            <label>
              갤러리 제목
              <input name="title" defaultValue={galleryPayload.title ?? ""} />
            </label>
            <div className="gallery-editor">
              {(galleryPayload.images ?? []).map((img, i) => (
                <div key={`${img.url}-${i}`} className="gallery-editor__item">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.alt} />
                  <span>{img.alt}</span>
                  <button type="button" className="btn-sm" onClick={() => removeGalleryImage(i)}>
                    제거
                  </button>
                </div>
              ))}
            </div>
            <p className="lead">미디어에서 이미지를 클릭하면 갤러리에 추가됩니다.</p>
            <MediaLibrary onSelect={addGalleryImage} />
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "저장 중…" : "제목 저장"}
            </button>
          </form>
        </section>
      )}

      {tab === "media" && (
        <section className="detail-section">
          <h2>미디어 라이브러리</h2>
          <MediaLibrary />
        </section>
      )}

      {tab === "publish" && (
        <section className="detail-section">
          <h2>게시</h2>
          <p className="lead">
            상태: <span className={`badge badge-${campaign.status as string}`}>{campaign.status as string}</span>
          </p>
          {campaign.status !== "published" && (
            <button type="button" className="btn-primary" onClick={() => void handlePublish()} disabled={saving}>
              {saving ? "게시 중…" : "게시하기"}
            </button>
          )}
          {publishResult && (
            <dl className="publish-result">
              <dt>CDN 무효화</dt>
              <dd>
                {publishResult.cdn.skipped
                  ? "건너뜀 (CloudFront 미설정)"
                  : publishResult.cdn.ok
                    ? `완료${publishResult.cdn.invalidationId ? ` (${publishResult.cdn.invalidationId})` : ""}`
                    : "실패"}
              </dd>
              <dt>웹 캐시 갱신</dt>
              <dd>{publishResult.revalidated ? "완료" : "건너뜀 또는 실패"}</dd>
            </dl>
          )}
        </section>
      )}
    </div>
  );
}
