"use client";

import { PlSectionHead } from "./PlSectionHead";

interface PlVideoBlockProps {
  title?: string;
  videoUrl: string;
  posterUrl?: string;
  onPlay?: () => void;
}

export function PlVideoBlock({ title, videoUrl, posterUrl, onPlay }: PlVideoBlockProps) {
  return (
    <section id="pl-section-video" className="pl-section pl-video">
      <div className="pl-container">
        <PlSectionHead
          eyebrow="PROMOTION"
          title={title ?? "홍보 영상"}
          description="프로젝트의 비전과 가치를 영상으로 만나보세요."
          align="center"
        />
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
      </div>
    </section>
  );
}
