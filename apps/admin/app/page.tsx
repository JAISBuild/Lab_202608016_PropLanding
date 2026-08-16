"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getDashboard } from "@/lib/api";
import { AdminShell } from "@/components/AdminShell";

export default function AdminHomePage() {
  const ready = useAuth();
  const [stats, setStats] = useState<{
    campaignCount: number;
    inquiryCount: number;
    newInquiries: number;
    upcomingAppointments: number;
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
      </div>
    </AdminShell>
  );
}
