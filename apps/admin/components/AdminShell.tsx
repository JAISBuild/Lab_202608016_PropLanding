"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clearToken } from "@/lib/api";

const nav = [
  { href: "/", label: "대시보드" },
  { href: "/campaigns", label: "캠페인" },
  { href: "/inquiries", label: "문의" },
  { href: "/appointments", label: "예약" },
  { href: "/messages", label: "발송" },
  { href: "/reports", label: "통계" },
  { href: "/status", label: "API" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="layout">
      <aside className="sidebar">
        <p className="logo">Control Tower</p>
        <nav>
          <ul>
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={pathname === item.href || pathname.startsWith(item.href + "/") ? "active" : ""}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="sidebar-footer">
          <Link href="http://localhost:3000/c/riverside" target="_blank" rel="noopener noreferrer">
            Public Demo →
          </Link>
          <button
            type="button"
            onClick={() => {
              clearToken();
              window.location.href = "/login";
            }}
          >
            로그아웃
          </button>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
