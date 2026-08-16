"use client";

import Image from "next/image";
import { useState } from "react";

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

  return (
    <section id="pl-section-gallery" className="pl-gallery">
      {title && <h2>{title}</h2>}
      <div className="pl-gallery__grid">
        {images.map((img, i) => (
          <button
            key={img.url}
            type="button"
            className="pl-gallery__item"
            onClick={() => open(i)}
            aria-label={`${img.alt} 확대`}
          >
            <Image src={img.url} alt={img.alt} fill sizes="(max-width:768px) 100vw, 33vw" />
          </button>
        ))}
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
