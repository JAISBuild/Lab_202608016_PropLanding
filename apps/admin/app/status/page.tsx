"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function AdminStatusPage() {
  const [ready, setReady] = useState<string>("로딩 중…");

  useEffect(() => {
    fetch(`${apiUrl}/ready`)
      .then((r) => r.json())
      .then((d) => setReady(JSON.stringify(d, null, 2)))
      .catch(() => setReady("API 연결 실패"));
  }, []);

  return (
    <div className="layout">
      <aside className="sidebar">
        <p className="logo">Control Tower</p>
        <nav>
          <ul>
            <li>
              <Link href="/">대시보드</Link>
            </li>
            <li>
              <Link href="/campaigns">캠페인 관리</Link>
            </li>
            <li>
              <Link href="/status">API 상태</Link>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="content">
        <h1>API 상태</h1>
        <pre className="code-block">{ready}</pre>
        <Link href="/" className="back">
          ← 대시보드
        </Link>
      </main>
    </div>
  );
}
