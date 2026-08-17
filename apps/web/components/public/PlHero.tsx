"use client";

import Image from "next/image";

interface PlHeroProps {
  headline: string;
  subheadline?: string;
  imageUrl?: string;
  brandName?: string;
}

export function PlHero({ headline, subheadline, imageUrl, brandName }: PlHeroProps) {
  return (
    <section id="pl-section-hero" className="pl-hero">
      {imageUrl && (
        <div className="pl-hero__image">
          <Image
            src={imageUrl}
            alt={headline}
            fill
            priority
            sizes="100vw"
            className="pl-hero__img"
          />
          <div className="pl-hero__overlay" />
        </div>
      )}
      <div className="pl-hero__content">
        <div className="pl-container">
          {brandName && <span className="pl-hero__eyebrow">{brandName}</span>}
          <h1 className="pl-hero__title">{headline}</h1>
          {subheadline && <p className="pl-hero__sub">{subheadline}</p>}
          <div className="pl-hero__actions">
            <a href="#pl-section-inquiry" className="pl-hero__cta pl-hero__cta--primary">
              상담 신청
            </a>
            <a href="#pl-section-gallery" className="pl-hero__cta pl-hero__cta--ghost">
              둘러보기
            </a>
          </div>
        </div>
      </div>
      <div className="pl-hero__scroll" aria-hidden>
        <span />
      </div>
    </section>
  );
}
