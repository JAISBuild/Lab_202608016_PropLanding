"use client";

import { useEffect, useState } from "react";
import { listMedia, type MediaAsset } from "@/lib/api";
import { PlMediaUploader } from "./PlMediaUploader";

interface MediaLibraryProps {
  onSelect?: (asset: MediaAsset) => void;
  selectedUrl?: string;
}

export function MediaLibrary({ onSelect, selectedUrl }: MediaLibraryProps) {
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);

  function refresh() {
    setLoading(true);
    listMedia()
      .then(setItems)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="media-library">
      <PlMediaUploader onUploaded={(asset) => setItems((prev) => [asset, ...prev])} />
      {loading ? (
        <p className="empty">불러오는 중…</p>
      ) : items.length === 0 ? (
        <p className="empty">업로드된 미디어가 없습니다.</p>
      ) : (
        <div className="media-library__grid">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`media-library__item${selectedUrl === item.url ? " is-selected" : ""}`}
              onClick={() => onSelect?.(item)}
              title={item.fileName}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.thumbUrl || item.url} alt={item.altText ?? item.fileName} />
              <span className="media-library__name">{item.fileName}</span>
            </button>
          ))}
        </div>
      )}
      <button type="button" className="btn-sm" onClick={refresh}>
        새로고침
      </button>
    </div>
  );
}
