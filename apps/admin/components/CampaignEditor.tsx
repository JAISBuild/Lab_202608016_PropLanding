"use client";

import { useState } from "react";
import Link from "next/link";
import {
  getCampaign,
  publishCampaign,
  updateCampaign,
  updateCampaignBlocks,
  updateCampaignUnitTypes,
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

type Tab = "basic" | "hero" | "gallery" | "video" | "faq" | "units" | "lifestyle" | "media" | "publish";

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
  const videoBlock = findBlock(blocks, "video");
  const faqBlock = findBlock(blocks, "faq");
  const lifestyleBlock = findBlock(blocks, "lifestyle");
  const heroPayload = (heroBlock?.payload ?? {}) as Record<string, string | undefined>;
  const galleryPayload = (galleryBlock?.payload ?? {}) as {
    title?: string;
    images?: { url: string; alt: string }[];
  };
  const videoPayload = (videoBlock?.payload ?? {}) as Record<string, string | undefined>;
  const faqPayload = (faqBlock?.payload ?? {}) as {
    headline?: string;
    items?: { q: string; a: string }[];
  };
  const lifestylePayload = (lifestyleBlock?.payload ?? {}) as Record<string, unknown>;
  const unitTypes = ((campaign.unitTypes as Array<{
    code: string;
    name: string;
    areaSqm: number | null;
    specs?: Record<string, unknown> | null;
    sortOrder?: number;
  }>) ?? []).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

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
    { id: "video", label: "영상" },
    { id: "faq", label: "FAQ" },
    { id: "units", label: "유닛" },
    { id: "lifestyle", label: "라이프·3D" },
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

      {tab === "video" && (
        <section className="detail-section">
          <h2>홍보 영상</h2>
          <form
            className="admin-form"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              void saveBlocks(
                upsertBlock(blocks, "video", 2, {
                  title: String(fd.get("title") ?? ""),
                  videoUrl: String(fd.get("videoUrl") ?? ""),
                  posterUrl: String(fd.get("posterUrl") ?? ""),
                }),
              );
            }}
          >
            <label>
              제목
              <input name="title" defaultValue={videoPayload.title ?? ""} />
            </label>
            <label>
              영상 URL
              <input name="videoUrl" defaultValue={videoPayload.videoUrl ?? ""} />
            </label>
            <label>
              포스터 이미지 URL
              <input name="posterUrl" defaultValue={videoPayload.posterUrl ?? ""} />
            </label>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "저장 중…" : "저장"}
            </button>
          </form>
        </section>
      )}

      {tab === "faq" && (
        <section className="detail-section">
          <h2>FAQ</h2>
          <form
            className="admin-form"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const raw = String(fd.get("itemsJson") ?? "[]");
              let items: { q: string; a: string }[] = [];
              try {
                items = JSON.parse(raw) as { q: string; a: string }[];
              } catch {
                setMessage("FAQ JSON 형식이 올바르지 않습니다.");
                return;
              }
              void saveBlocks(
                upsertBlock(blocks, "faq", 4, {
                  headline: String(fd.get("headline") ?? ""),
                  items,
                }),
              );
            }}
          >
            <label>
              섹션 헤드라인
              <input name="headline" defaultValue={faqPayload.headline ?? ""} />
            </label>
            <label>
              항목 JSON (배열: q, a)
              <textarea
                name="itemsJson"
                rows={14}
                defaultValue={JSON.stringify(faqPayload.items ?? [], null, 2)}
              />
            </label>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "저장 중…" : "저장"}
            </button>
          </form>
        </section>
      )}

      {tab === "units" && (
        <section className="detail-section">
          <h2>유닛 타입</h2>
          <form
            className="admin-form"
            onSubmit={(e) => {
              e.preventDefault();
              setSaving(true);
              setMessage(null);
              const fd = new FormData(e.currentTarget);
              try {
                const units = JSON.parse(String(fd.get("unitsJson") ?? "[]")) as Array<{
                  code: string;
                  name: string;
                  areaSqm?: number | null;
                  specs?: Record<string, unknown> | null;
                  sortOrder?: number;
                }>;
                void updateCampaignUnitTypes(campaignId, units)
                  .then(async () => {
                    await reload();
                    setMessage("유닛이 저장되었습니다.");
                  })
                  .catch((err) => setMessage(err instanceof Error ? err.message : "저장 실패"))
                  .finally(() => setSaving(false));
              } catch {
                setSaving(false);
                setMessage("유닛 JSON 형식이 올바르지 않습니다.");
              }
            }}
          >
            <label>
              유닛 JSON (code, name, areaSqm, specs, sortOrder)
              <textarea
                name="unitsJson"
                rows={16}
                defaultValue={JSON.stringify(
                  unitTypes.map((u) => ({
                    code: u.code,
                    name: u.name,
                    areaSqm: u.areaSqm,
                    specs: u.specs ?? null,
                    sortOrder: u.sortOrder ?? 0,
                  })),
                  null,
                  2,
                )}
              />
            </label>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "저장 중…" : "저장"}
            </button>
          </form>
        </section>
      )}

      {tab === "lifestyle" && (
        <section className="detail-section">
          <h2>라이프스타일 · 3D 일조(남/북향)</h2>
          <p className="lead">
            카피·이미지·일조 위도/경도·동별 face(방위각°)를 JSON으로 수정합니다. face 180≈남향, 0≈북향.
          </p>
          <form
            className="admin-form"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              try {
                const payload = JSON.parse(String(fd.get("lifestyleJson") ?? "{}")) as Record<
                  string,
                  unknown
                >;
                void saveBlocks(upsertBlock(blocks, "lifestyle", 5, payload));
              } catch {
                setMessage("라이프스타일 JSON 형식이 올바르지 않습니다.");
              }
            }}
          >
            <label>
              lifestyle 블록 JSON
              <textarea
                name="lifestyleJson"
                rows={22}
                defaultValue={JSON.stringify(
                  Object.keys(lifestylePayload).length
                    ? lifestylePayload
                    : {
                        headline: "하루를 바꾸는 작은 설계.",
                        lightTitle: "빛이 머무는 집의 방향.",
                        lightBody: "",
                        smartTitle: "집 안과 지하가 한 화면.",
                        smartBody: "",
                        commonTitle: "함께여서 더 편안한 공용부.",
                        commonBody: "",
                        spaces: [],
                        sunStudy: { latitude: 37.5665, longitude: 126.978, dongs: [] },
                      },
                  null,
                  2,
                )}
              />
            </label>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "저장 중…" : "저장"}
            </button>
          </form>
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
