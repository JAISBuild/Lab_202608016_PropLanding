"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface HealthData {
  status: string;
  service: string;
  version: string;
  timestamp: string;
}

interface ReadyData {
  status: string;
  checks: { database: string };
  timestamp: string;
}

export default function StatusPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [ready, setReady] = useState<ReadyData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const [healthRes, readyRes] = await Promise.all([
          fetch(`${apiUrl}/health`),
          fetch(`${apiUrl}/ready`),
        ]);
        setHealth(await healthRes.json());
        setReady(await readyRes.json());
      } catch {
        setError("API 서버에 연결할 수 없습니다. docker compose up && pnpm dev:api");
      }
    }
    void fetchStatus();
  }, []);

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">연결 확인</p>
        <h1>API 상태</h1>
        {error && <p className="error">{error}</p>}
        {health && (
          <pre className="code-block">{JSON.stringify(health, null, 2)}</pre>
        )}
        {ready && (
          <pre className="code-block">{JSON.stringify(ready, null, 2)}</pre>
        )}
        <div className="actions">
          <Link href="/" className="btn btn-secondary">
            ← 홈으로
          </Link>
        </div>
      </section>
    </main>
  );
}
