"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getInquiry, updateInquiryStatus } from "@/lib/api";
import { AdminShell } from "@/components/AdminShell";

export default function InquiryDetailPage() {
  const ready = useAuth();
  const params = useParams();
  const id = params.id as string;
  const [inquiry, setInquiry] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!ready || !id) return;
    getInquiry(id).then(setInquiry);
  }, [ready, id]);

  if (!ready || !inquiry) return null;

  const events = (inquiry.events as Array<{ type: string; createdAt: string; payload: unknown }>) ?? [];
  const analytics = (inquiry.analyticsEvents as Array<{ eventName: string; occurredAt: string }>) ?? [];

  return (
    <AdminShell>
      <Link href="/inquiries" className="back-link">
        ← 문의 목록
      </Link>
      <h1>{inquiry.fullName as string}</h1>
      <p className="lead">
        {inquiry.phone as string} · {inquiry.status as string} · 스코어 {inquiry.leadScore as number}
      </p>
      {inquiry.aiCategory ? (
        <p className="ai-tag">AI 분류: {inquiry.aiCategory as string}</p>
      ) : null}
      <div className="action-row">
        {["contacted", "qualified", "visit_scheduled", "won", "lost"].map((s) => (
          <button
            key={s}
            type="button"
            className="btn-sm"
            onClick={() =>
              updateInquiryStatus(id, s).then(() => getInquiry(id).then(setInquiry))
            }
          >
            {s}
          </button>
        ))}
      </div>
      <section className="detail-section">
        <h2>활동 이력</h2>
        <ul className="timeline">
          {events.map((e, i) => (
            <li key={i}>
              <strong>{e.type}</strong> — {new Date(e.createdAt).toLocaleString()}
            </li>
          ))}
        </ul>
      </section>
      <section className="detail-section">
        <h2>행동 분석 (360°)</h2>
        <ul className="timeline">
          {analytics.map((e, i) => (
            <li key={i}>
              {e.eventName} — {new Date(e.occurredAt).toLocaleString()}
            </li>
          ))}
          {analytics.length === 0 && <li>이벤트 없음</li>}
        </ul>
      </section>
    </AdminShell>
  );
}
