"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getCampaigns, publishCampaign } from "@/lib/api";
import { AdminShell } from "@/components/AdminShell";

interface Campaign {
  id: string;
  title: string;
  slug: string;
  status: string;
  _count?: { inquiries: number; siteBlocks: number };
}

export default function CampaignsPage() {
  const ready = useAuth();
  const [items, setItems] = useState<Campaign[]>([]);

  useEffect(() => {
    if (!ready) return;
    getCampaigns().then((d) => setItems(d as Campaign[]));
  }, [ready]);

  if (!ready) return null;

  return (
    <AdminShell>
      <div className="page-header">
        <h1>캠페인 관리</h1>
        <Link href="/campaigns/new" className="btn-primary">
          + 새 캠페인
        </Link>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>제목</th>
            <th>Slug</th>
            <th>상태</th>
            <th>블록</th>
            <th>문의</th>
            <th>액션</th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id}>
              <td>
                <Link href={`/campaigns/${c.id}`}>{c.title}</Link>
              </td>
              <td>
                <Link href={`http://localhost:3000/c/${c.slug}`} target="_blank">
                  /c/{c.slug}
                </Link>
              </td>
              <td>
                <span className={`badge badge-${c.status}`}>{c.status}</span>
              </td>
              <td>{c._count?.siteBlocks ?? 0}</td>
              <td>{c._count?.inquiries ?? 0}</td>
              <td>
                {c.status !== "published" && (
                  <button
                    type="button"
                    className="btn-sm"
                    onClick={() =>
                      publishCampaign(c.id).then(() =>
                        setItems((prev) =>
                          prev.map((x) => (x.id === c.id ? { ...x, status: "published" } : x)),
                        ),
                      )
                    }
                  >
                    게시
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && (
        <p className="empty">
          캠페인이 없습니다. <Link href="/campaigns/new">첫 캠페인 만들기</Link>
        </p>
      )}
    </AdminShell>
  );
}
