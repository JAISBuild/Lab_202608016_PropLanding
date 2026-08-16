"use client";

import Image from "next/image";

interface PlHeroProps {
  headline: string;
  subheadline?: string;
  imageUrl?: string;
}

export function PlHero({ headline, subheadline, imageUrl }: PlHeroProps) {
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
        <h1>{headline}</h1>
        {subheadline && <p>{subheadline}</p>}
      </div>
    </section>
  );
}
