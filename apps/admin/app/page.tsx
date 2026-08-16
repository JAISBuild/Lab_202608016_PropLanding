import Link from "next/link";

const navItems = [
  { href: "/", label: "대시보드" },
  { href: "/campaigns", label: "캠페인 관리" },
  { href: "/status", label: "API 상태" },
];

export default function AdminHomePage() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <p className="logo">Control Tower</p>
        <nav>
          <ul>
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link href="http://localhost:3000" className="external">
          Public Web →
        </Link>
      </aside>
      <main className="content">
        <p className="eyebrow">Phase 0</p>
        <h1>대시보드</h1>
        <p className="lead">
          Site Factory·문의 관리 기능은 Phase 1~4에서 연결됩니다.
        </p>
        <div className="cards">
          <Link href="/campaigns" className="card">
            <h2>캠페인</h2>
            <p>Phase 1에서 CRUD 연결</p>
          </Link>
          <Link href="/status" className="card">
            <h2>API 상태</h2>
            <p>/health · /ready 확인</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
