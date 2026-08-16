"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getCampaign, publishCampaign } from "@/lib/api";
import { AdminShell } from "@/components/AdminShell";

export default function CampaignDetailPage() {
  const ready = useAuth();
  const params = useParams();
  const id = params.id as string;
  const [campaign, setCampaign] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!ready || !id) return;
    getCampaign(id).then(setCampaign);
  }, [ready, id]);

  if (!ready || !campaign) return null;

  const slug = campaign.slug as string;
  const previewToken = campaign.previewToken as string;

  return (
    <AdminShell>
      <Link href="/campaigns" className="back-link">
        ← 캠페인 목록
      </Link>
      <h1>{campaign.title as string}</h1>
      <p className="lead">상태: {campaign.status as string}</p>
      <div className="action-row">
        <Link
          href={`http://localhost:3000/c/${slug}?preview=${previewToken}`}
          target="_blank"
          className="btn-secondary"
        >
          미리보기
        </Link>
        {campaign.status !== "published" && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => publishCampaign(id).then(() => getCampaign(id).then(setCampaign))}
          >
            게시하기
          </button>
        )}
        <Link href={`http://localhost:3000/c/${slug}`} target="_blank" className="btn-secondary">
          공개 URL
        </Link>
      </div>
      <section className="detail-section">
        <h2>기본 정보</h2>
        <dl>
          <dt>Slug</dt>
          <dd>{slug}</dd>
          <dt>연락처</dt>
          <dd>{(campaign.contactPhone as string) ?? "—"}</dd>
        </dl>
      </section>
      <section className="detail-section">
        <h2>사이트 블록 ({(campaign.siteBlocks as unknown[])?.length ?? 0})</h2>
        <pre className="code-preview">
          {JSON.stringify(campaign.siteBlocks, null, 2)}
        </pre>
      </section>
    </AdminShell>
  );
}
