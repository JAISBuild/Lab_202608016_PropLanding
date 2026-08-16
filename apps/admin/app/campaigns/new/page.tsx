"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { createCampaign } from "@/lib/api";
import { AdminShell } from "@/components/AdminShell";

export default function NewCampaignPage() {
  const ready = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  if (!ready) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const c = await createCampaign({
        title: String(fd.get("title")),
        slug: String(fd.get("slug")),
        contactPhone: String(fd.get("contactPhone") || "") || undefined,
      });
      router.push(`/campaigns/${(c as { id: string }).id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "생성 실패");
    }
  }

  return (
    <AdminShell>
      <h1>새 캠페인</h1>
      <form className="admin-form" onSubmit={handleSubmit}>
        <label>
          제목
          <input name="title" required placeholder="리버사이드 힐스" />
        </label>
        <label>
          Slug (URL)
          <input name="slug" required pattern="[a-z0-9-]+" placeholder="riverside" />
        </label>
        <label>
          상담 전화
          <input name="contactPhone" placeholder="1588-0000" />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn-primary">
          생성
        </button>
      </form>
    </AdminShell>
  );
}
