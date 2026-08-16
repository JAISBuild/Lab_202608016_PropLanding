import Link from "next/link";

export default function CampaignsPage() {
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
        <h1>캠페인 관리</h1>
        <p className="lead">Phase 1 Site Factory에서 목록·생성 API가 연결됩니다.</p>
        <Link href="/" className="back">
          ← 대시보드
        </Link>
      </main>
    </div>
  );
}
