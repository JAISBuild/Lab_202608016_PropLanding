"use client";

interface PlVideoBlockProps {
  title?: string;
  videoUrl: string;
  posterUrl?: string;
  onPlay?: () => void;
}

export function PlVideoBlock({ title, videoUrl, posterUrl, onPlay }: PlVideoBlockProps) {
  return (
    <section id="pl-section-video" className="pl-video">
      {title && <h2>{title}</h2>}
      <div className="pl-video__wrap">
        <iframe
          src={videoUrl}
          title={title ?? "홍보 영상"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={onPlay}
        />
        {posterUrl && <div className="pl-video__poster" style={{ backgroundImage: `url(${posterUrl})` }} />}
      </div>
    </section>
  );
}
