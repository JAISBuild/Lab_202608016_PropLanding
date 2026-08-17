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
          <span className="pl-header__brand-mark" aria-hidden />
          <span className="pl-header__brand-text">{title}</span>
        </a>
        <nav className="pl-header__nav" aria-label="주요 섹션">
          <a href="#pl-section-gallery">갤러리</a>
          <a href="#pl-section-units">타입</a>
          <a href="#pl-section-inquiry">상담</a>
        </nav>
        {phone && (
          <a href={`tel:${phone.replace(/-/g, "")}`} className="pl-header__phone">
            {phone}
          </a>
        )}
      </div>
    </header>
  );
}
