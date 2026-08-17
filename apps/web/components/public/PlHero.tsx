import { PlMark } from "./PlMark";

interface PlHeroProps {
  headline: string;
  subheadline?: string;
  imageUrl?: string;
  brandName?: string;
}

function splitHeadline(headline: string) {
  const trimmed = headline.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length < 2) return { before: trimmed, accent: "" };
  return { before: parts.slice(0, -1).join(" "), accent: parts[parts.length - 1] };
}

const LOCAL_HERO = "/images/hero-apartment-dusk.jpg";

function resolveHeroSrc(imageUrl?: string) {
  if (!imageUrl) return LOCAL_HERO;
  if (
    imageUrl.includes("picsum.photos") ||
    imageUrl.includes("hero-apartment-night.jpg")
  ) {
    return LOCAL_HERO;
  }
  return imageUrl;
}

export function PlHero({ headline, subheadline, imageUrl, brandName }: PlHeroProps) {
  const { before, accent } = splitHeadline(headline);
  const src = resolveHeroSrc(imageUrl);

  return (
    <section id="pl-section-hero" className="pl-hero">
      <div className="pl-hero__copy">
        <p className="pl-kicker">
          <span />
          {brandName ? `${brandName.toUpperCase()} STUDY` : "A RESIDENTIAL STUDY"}
        </p>
        <h1 className="pl-hero__title">
          {before}{" "}
          {accent ? <PlMark onDark>{accent}</PlMark> : null}
        </h1>
        {subheadline ? <p className="pl-hero__sub">{subheadline}</p> : null}
        <div className="pl-hero__actions">
          <a href="#pl-section-inquiry" className="pl-btn-lime">
            방문 상담 예약 <span aria-hidden>→</span>
          </a>
          <a href="#pl-section-gallery" className="pl-btn-ghost">
            프로젝트 살펴보기 <span aria-hidden>↓</span>
          </a>
        </div>
      </div>
      <div className="pl-hero__visual">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="아파트 단지 야경" className="pl-hero__img" />
        <p className="pl-hero__scroll">SCROLL TO DISCOVER</p>
      </div>
    </section>
  );
}
