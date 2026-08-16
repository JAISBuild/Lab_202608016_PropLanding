import Link from "next/link";
import { API_VERSION } from "@proplanding/shared";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Phase 0 · Public App</p>
        <h1>PropLanding</h1>
        <p className="lead">
          분양 캠페인 랜딩 페이지 플랫폼 — 그래픽 중심 전환 경험을 준비 중입니다.
        </p>
        <div className="actions">
          <Link href="/status" className="btn btn-primary">
            API 상태 확인
          </Link>
          <a
            href={`${apiUrl}/health`}
            className="btn btn-secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            /health 열기
          </a>
        </div>
      </section>
      <footer className="footer">
        <span>API {API_VERSION}</span>
        <Link href="http://localhost:3001">Control Tower →</Link>
      </footer>
    </main>
  );
}
