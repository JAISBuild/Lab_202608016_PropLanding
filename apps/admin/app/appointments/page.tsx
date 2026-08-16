"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getAppointments } from "@/lib/api";
import { AdminShell } from "@/components/AdminShell";

interface Appointment {
  id: string;
  scheduledAt: string;
  status: string;
  inquiry: {
    id: string;
    fullName: string;
    phone: string;
    campaign: { title: string };
  };
}

export default function AppointmentsPage() {
  const ready = useAuth();
  const [items, setItems] = useState<Appointment[]>([]);

  useEffect(() => {
    if (!ready) return;
    getAppointments().then((d) => setItems(d as Appointment[]));
  }, [ready]);

  if (!ready) return null;

  return (
    <AdminShell>
      <h1>예약 관리</h1>
      <table className="data-table">
        <thead>
          <tr>
            <th>일시</th>
            <th>고객</th>
            <th>캠페인</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {items.map((a) => (
            <tr key={a.id}>
              <td>{new Date(a.scheduledAt).toLocaleString()}</td>
              <td>
                <Link href={`/inquiries/${a.inquiry.id}`}>{a.inquiry.fullName}</Link>
              </td>
              <td>{a.inquiry.campaign.title}</td>
              <td>{a.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && <p className="empty">예약이 없습니다.</p>}
    </AdminShell>
  );
}
