"use client";

import Image from "next/image";
import { useState } from "react";
import { PlMark } from "./PlMark";

interface GalleryImage {
  url: string;
  alt: string;
}

interface PlGalleryProps {
  title?: string;
  images: GalleryImage[];
  onImageClick?: (index: number) => void;
}

export function PlGallery({ title, images, onImageClick }: PlGalleryProps) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const featured = images[0];
  const rest = images.slice(1);

  const open = (i: number) => {
    setLightbox(i);
    onImageClick?.(i);
  };

  if (images.length === 0) return null;

  return (
    <section id="pl-section-gallery" className="pl-gallery">
      <div className="pl-container pl-gallery__eco">
        <button type="button" className="pl-gallery__feature" onClick={() => open(0)} aria-label={`${featured.alt} 확대`}>
          <Image src={featured.url} alt={featured.alt} fill sizes="(max-width:900px) 100vw, 55vw" />
          <span>{featured.alt} / 01</span>
        </button>
        <div className="pl-gallery__copy">
          <p className="pl-kicker pl-kicker--light">
            <span />
            A LIVING ECOSYSTEM
          </p>
          <h2 className="pl-display">
            도시를 누리고, <PlMark>집에서 회복하는</PlMark> 구조.
          </h2>
          <p>
            단지의 바깥은 빠르게, 안은 천천히. 조감도로 전체 배치를 보고, 커뮤니티 시설과 조경을 이어서 확인하세요.
          </p>
          <a href="#pl-section-units" className="pl-text-link">
            내게 맞는 타입 찾기 →
          </a>
        </div>
      </div>
      {rest.length > 0 ? (
        <div className="pl-container pl-gallery__row">
          {rest.map((img, i) => (
            <button
              key={img.url}
              type="button"
              className="pl-gallery__thumb"
              onClick={() => open(i + 1)}
              aria-label={`${img.alt} 확대`}
            >
              <Image src={img.url} alt={img.alt} fill sizes="(max-width:768px) 100vw, 33vw" />
              <em>{img.alt}</em>
            </button>
          ))}
        </div>
      ) : null}
      {lightbox !== null && (
        <div className="pl-lightbox" role="dialog" onClick={() => setLightbox(null)}>
          <button type="button" className="pl-lightbox__close" onClick={() => setLightbox(null)}>
            ✕
          </button>
          <div className="pl-lightbox__inner" onClick={(e) => e.stopPropagation()}>
            <Image
              src={images[lightbox].url}
              alt={images[lightbox].alt}
              width={1200}
              height={800}
              className="pl-lightbox__img"
            />
            <p>{images[lightbox].alt}</p>
          </div>
        </div>
      )}
    </section>
  );
}
