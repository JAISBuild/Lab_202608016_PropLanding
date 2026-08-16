import Link from "next/link";

export default function WebHomePage() {
  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">PropLanding</p>
        <h1>분양 캠페인 랜딩</h1>
        <p className="lead">데모 캠페인을 확인하세요 — 그래픽 중심 전환 경험</p>
        <div className="actions">
          <Link href="/c/riverside" className="btn btn-primary">
            리버사이드 힐스 보기
          </Link>
          <Link href="/status" className="btn btn-secondary">
            API 상태
          </Link>
        </div>
      </section>
      <footer className="footer">
        <Link href="http://localhost:3001">Control Tower →</Link>
      </footer>
    </main>
  );
}
