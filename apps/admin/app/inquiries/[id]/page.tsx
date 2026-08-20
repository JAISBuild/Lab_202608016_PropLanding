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
  const appointments =
    (inquiry.appointments as Array<{ id: string; scheduledAt: string; status: string; note?: string }>) ?? [];
  const deliveries =
    (inquiry.messageDeliveries as Array<{
      id: string;
      channel: string;
      methodLabel: string;
      recipient: string;
      subject: string | null;
      body: string;
      status: string;
      sentAt: string | null;
      createdAt: string;
      errorMessage?: string | null;
    }>) ?? [];
  const interestedUnit = inquiry.interestedUnit as { name?: string; code?: string } | null;
  const preferredVisitAt = inquiry.preferredVisitAt as string | null;

  return (
    <AdminShell>
      <Link href="/inquiries" className="back-link">
        ← 문의 목록
      </Link>
      <h1>{inquiry.fullName as string}</h1>
      <p className="lead">
        {inquiry.phone as string} · {inquiry.status as string} · 스코어 {inquiry.leadScore as number}
      </p>

      <section className="detail-section">
        <h2>희망 방문 · 관심 타입</h2>
        <dl className="detail-dl">
          <div>
            <dt>희망 일시</dt>
            <dd>
              {preferredVisitAt
                ? new Date(preferredVisitAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })
                : "미입력"}
            </dd>
          </div>
          <div>
            <dt>관심 타입</dt>
            <dd>
              {interestedUnit
                ? `${interestedUnit.name ?? ""}${interestedUnit.code ? ` (${interestedUnit.code})` : ""}`
                : "미선택"}
            </dd>
          </div>
        </dl>
        {appointments.length > 0 && (
          <ul className="timeline">
            {appointments.map((a) => (
              <li key={a.id}>
                <strong>{a.status}</strong> —{" "}
                {new Date(a.scheduledAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
                {a.note ? ` · ${a.note}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="detail-section">
        <h2>자동 안내 발송</h2>
        {deliveries.length === 0 && <p className="empty">발송 기록이 없습니다.</p>}
        <ul className="message-log">
          {deliveries.map((d) => (
            <li key={d.id}>
              <p>
                <strong>{d.methodLabel}</strong> · {d.status}
              </p>
              <p className="muted">
                {new Date(d.sentAt ?? d.createdAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} ·{" "}
                {d.recipient}
              </p>
              {d.subject ? <p>{d.subject}</p> : null}
              <pre className="message-body">{d.body}</pre>
              {d.errorMessage ? <p className="error-text">{d.errorMessage}</p> : null}
            </li>
          ))}
        </ul>
      </section>

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
