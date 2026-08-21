"use client";

interface PlVideoBlockProps {
  title?: string;
  videoUrl: string;
  posterUrl?: string;
  onPlay?: () => void;
}

function isFileVideo(url: string) {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url);
}

export function PlVideoBlock({ title, videoUrl, posterUrl, onPlay }: PlVideoBlockProps) {
  const file = isFileVideo(videoUrl);

  return (
    <section id="pl-section-video" className="pl-video">
      <div className="pl-container">
        <p className="pl-kicker pl-kicker--on-dark">
          <span />
          CAMPAIGN FILM
        </p>
        <div className="pl-video__head">
          <h2>
            단지의 속도와
            <em>집의 온도.</em>
          </h2>
          <p>{title ?? "주거 홍보 영상"} — 실제 생활 공간을 먼저 둘러보세요.</p>
        </div>
        <div className="pl-video__wrap">
          {file ? (
            <video
              src={videoUrl}
              poster={posterUrl}
              controls
              playsInline
              preload="metadata"
              onPlay={onPlay}
              title={title ?? "분양 홍보 영상"}
            />
          ) : (
            <iframe
              src={videoUrl}
              title={title ?? "홍보 영상"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={onPlay}
            />
          )}
        </div>
      </div>
    </section>
  );
}
