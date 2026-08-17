"use client";

import Image from "next/image";
import { useState } from "react";
import { PlSectionHead } from "./PlSectionHead";

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

  const open = (i: number) => {
    setLightbox(i);
    onImageClick?.(i);
  };

  if (images.length === 0) return null;

  return (
    <section id="pl-section-gallery" className="pl-section pl-gallery">
      <div className="pl-container">
        <PlSectionHead
          eyebrow="GALLERY"
          title={title ?? "사업지 갤러리"}
          description="프리미엄 라이프를 완성하는 공간과 조경을 미리 만나보세요."
        />
        <div className="pl-gallery__grid">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              className={`pl-gallery__item${i === 0 ? " pl-gallery__item--featured" : ""}`}
              onClick={() => open(i)}
              aria-label={`${img.alt} 확대`}
            >
              <Image src={img.url} alt={img.alt} fill sizes="(max-width:768px) 100vw, 33vw" />
              <span className="pl-gallery__caption">{img.alt}</span>
            </button>
          ))}
        </div>
      </div>
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
