"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getReports } from "@/lib/api";
import { AdminShell } from "@/components/AdminShell";

export default function ReportsPage() {
  const ready = useAuth();
  const [report, setReport] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!ready) return;
    getReports().then(setReport);
  }, [ready]);

  if (!ready) return null;

  const campaigns = (report?.campaigns as Array<Record<string, unknown>>) ?? [];
  const events = (report?.events as Array<{ name: string; count: number }>) ?? [];
  const utmSources = (report?.utmSources as Array<{ source: string; count: number }>) ?? [];

  return (
    <AdminShell>
      <h1>통계 · Attribution</h1>
      <section className="detail-section">
        <h2>캠페인별 성과</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>캠페인</th>
              <th>문의</th>
              <th>이벤트</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id as string}>
                <td>{c.title as string}</td>
                <td>{c.inquiryCount as number}</td>
                <td>{c.eventCount as number}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="detail-section">
        <h2>이벤트 분포</h2>
        <ul className="timeline">
          {events.map((e) => (
            <li key={e.name}>
              {e.name}: {e.count}
            </li>
          ))}
        </ul>
      </section>
      <section className="detail-section">
        <h2>UTM 유입</h2>
        <ul className="timeline">
          {utmSources.map((u) => (
            <li key={u.source}>
              {u.source}: {u.count}
            </li>
          ))}
          {utmSources.length === 0 && <li>데이터 없음</li>}
        </ul>
      </section>
      <Link href="/inquiries" className="back-link">
        문의 목록 →
      </Link>
    </AdminShell>
  );
}
