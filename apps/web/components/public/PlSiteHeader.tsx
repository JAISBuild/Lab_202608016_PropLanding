"use client";

interface PlSiteHeaderProps {
  title: string;
  phone?: string | null;
}

export function PlSiteHeader({ title, phone }: PlSiteHeaderProps) {
  return (
    <header className="pl-header">
      <div className="pl-container pl-header__inner">
        <a href="#pl-section-hero" className="pl-header__brand">
          <span className="pl-header__mark" aria-hidden>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path
                d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="pl-header__brand-copy">
            <strong>{title}</strong>
            <small>A LIVING STUDY</small>
          </span>
        </a>
        <nav className="pl-header__nav" aria-label="주요 섹션">
          <a href="#pl-section-hero">프로젝트</a>
          <a href="#pl-section-units">타입 보기</a>
          <a href="#pl-section-lifestyle">입지 안내</a>
          <a href="#pl-section-inquiry">방문 예약</a>
        </nav>
        <a href="#pl-section-inquiry" className="pl-header__cta">
          <span aria-hidden>📅</span>
          방문 예약
        </a>
        {phone ? (
          <a href={`tel:${phone.replace(/-/g, "")}`} className="pl-header__phone">
            {phone}
          </a>
        ) : null}
      </div>
    </header>
  );
}
