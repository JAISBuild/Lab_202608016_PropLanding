"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getDashboard } from "@/lib/api";
import { AdminShell } from "@/components/AdminShell";

type RecentMessage = {
  id: string;
  methodLabel: string;
  channel: string;
  status: string;
  body: string;
  subject: string | null;
  sentAt: string | null;
  createdAt: string;
  inquiry?: { fullName: string } | null;
};

export default function AdminHomePage() {
  const ready = useAuth();
  const [stats, setStats] = useState<{
    campaignCount: number;
    inquiryCount: number;
    newInquiries: number;
    upcomingAppointments: number;
    messagesSent?: number;
    messagesFailed?: number;
    messagesTotal?: number;
    recentMessages?: RecentMessage[];
  } | null>(null);

  useEffect(() => {
    if (!ready) return;
    getDashboard().then(setStats).catch(console.error);
  }, [ready]);

  if (!ready) return null;

  return (
    <AdminShell>
      <p className="eyebrow">대시보드</p>
      <h1>Control Tower</h1>
      <div className="cards">
        <Link href="/campaigns" className="card">
          <h2>{stats?.campaignCount ?? "—"}</h2>
          <p>캠페인</p>
        </Link>
        <Link href="/inquiries?status=new" className="card">
          <h2>{stats?.newInquiries ?? "—"}</h2>
          <p>신규 문의</p>
        </Link>
        <Link href="/inquiries" className="card">
          <h2>{stats?.inquiryCount ?? "—"}</h2>
          <p>전체 문의</p>
        </Link>
        <Link href="/appointments" className="card">
          <h2>{stats?.upcomingAppointments ?? "—"}</h2>
          <p>예정 방문</p>
        </Link>
        <Link href="/messages" className="card">
          <h2>{stats?.messagesSent ?? "—"}</h2>
          <p>안내 발송 성공</p>
        </Link>
        <Link href="/messages" className="card">
          <h2>{stats?.messagesFailed ?? "—"}</h2>
          <p>발송 실패</p>
        </Link>
      </div>

      <section className="detail-section">
        <div className="section-head">
          <h2>최근 자동 안내 발송</h2>
          <Link href="/messages">전체 보기 →</Link>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>일시</th>
              <th>고객</th>
              <th>방법</th>
              <th>상태</th>
              <th>내용</th>
            </tr>
          </thead>
          <tbody>
            {(stats?.recentMessages ?? []).map((m) => (
              <tr key={m.id}>
                <td>
                  {new Date(m.sentAt ?? m.createdAt).toLocaleString("ko-KR", {
                    timeZone: "Asia/Seoul",
                  })}
                </td>
                <td>{m.inquiry?.fullName ?? "—"}</td>
                <td>{m.methodLabel}</td>
                <td>
                  <span className={`badge badge-${m.status}`}>{m.status}</span>
                </td>
                <td className="clip">{m.subject ?? m.body}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(stats?.recentMessages?.length ?? 0) === 0 && (
          <p className="empty">아직 발송 기록이 없습니다. 문의가 들어오면 카카오·문자가 기록됩니다.</p>
        )}
      </section>
    </AdminShell>
  );
}
