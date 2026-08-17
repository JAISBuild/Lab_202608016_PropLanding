"use client";

interface PlVideoBlockProps {
  title?: string;
  videoUrl: string;
  posterUrl?: string;
  onPlay?: () => void;
}

export function PlVideoBlock({ title, videoUrl, onPlay }: PlVideoBlockProps) {
  return (
    <section id="pl-section-video" className="pl-video">
      <div className="pl-container">
        <p className="pl-kicker pl-kicker--on-dark">
          <span />
          THE PERSONAL RADIUS
        </p>
        <div className="pl-video__head">
          <h2>
            도시의 속도와
            <em>나의 온도.</em>
          </h2>
          <p>{title ?? "가상의 도심 생활권 프로젝트"} — 영상으로 공간의 리듬을 먼저 느껴 보세요.</p>
        </div>
        <div className="pl-video__wrap">
          <iframe
            src={videoUrl}
            title={title ?? "홍보 영상"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={onPlay}
          />
        </div>
      </div>
    </section>
  );
}
