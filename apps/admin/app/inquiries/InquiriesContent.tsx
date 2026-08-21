"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getInquiries } from "@/lib/api";
import { AdminShell } from "@/components/AdminShell";

interface Inquiry {
  id: string;
  fullName: string;
  phone: string;
  status: string;
  leadScore: number;
  preferredVisitAt?: string | null;
  createdAt: string;
  campaign?: { title: string; slug: string };
  assignedStaff?: { name: string };
  interestedUnit?: { name: string; code: string } | null;
}

export default function InquiriesContent() {
  const ready = useAuth();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? undefined;
  const [items, setItems] = useState<Inquiry[]>([]);

  useEffect(() => {
    if (!ready) return;
    getInquiries({ status }).then((d) => setItems(d as Inquiry[]));
  }, [ready, status]);

  if (!ready) return null;

  const filters = [
    { label: "전체", value: undefined },
    { label: "신규", value: "new" },
    { label: "상담중", value: "contacted" },
    { label: "방문예약", value: "visit_scheduled" },
  ];

  return (
    <AdminShell>
      <h1>문의 관리</h1>
      <div className="filter-row">
        {filters.map((f) => (
          <Link
            key={f.label}
            href={f.value ? `/inquiries?status=${f.value}` : "/inquiries"}
            className={status === f.value ? "filter active" : "filter"}
          >
            {f.label}
          </Link>
        ))}
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>이름</th>
            <th>연락처</th>
            <th>희망 일시</th>
            <th>관심 타입</th>
            <th>캠페인</th>
            <th>상태</th>
            <th>스코어</th>
            <th>담당</th>
          </tr>
        </thead>
        <tbody>
          {items.map((inq) => (
            <tr key={inq.id}>
              <td>
                <Link href={`/inquiries/${inq.id}`}>{inq.fullName}</Link>
              </td>
              <td>{inq.phone}</td>
              <td>
                {inq.preferredVisitAt
                  ? new Date(inq.preferredVisitAt).toLocaleString("ko-KR", {
                      timeZone: "Asia/Seoul",
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </td>
              <td>{inq.interestedUnit?.name ?? "—"}</td>
              <td>{inq.campaign?.title}</td>
              <td>
                <span className={`badge badge-${inq.status}`}>{inq.status}</span>
              </td>
              <td>{inq.leadScore}</td>
              <td>{inq.assignedStaff?.name ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && <p className="empty">문의가 없습니다.</p>}
    </AdminShell>
  );
}
