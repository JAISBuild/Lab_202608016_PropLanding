"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getCampaign } from "@/lib/api";
import { AdminShell } from "@/components/AdminShell";
import { CampaignEditor } from "@/components/CampaignEditor";

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

  return (
    <AdminShell>
      <Link href="/campaigns" className="back-link">
        ← 캠페인 목록
      </Link>
      <h1>{campaign.title as string}</h1>
      <p className="lead">
        상태: <span className={`badge badge-${campaign.status as string}`}>{campaign.status as string}</span>
      </p>
      <CampaignEditor campaignId={id} initial={campaign} onUpdate={setCampaign} />
    </AdminShell>
  );
}
