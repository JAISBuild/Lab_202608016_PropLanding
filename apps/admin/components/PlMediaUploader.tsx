"use client";

import { useCallback, useRef, useState } from "react";
import { uploadMedia, type MediaAsset } from "@/lib/api";

interface PlMediaUploaderProps {
  onUploaded?: (asset: MediaAsset) => void;
  accept?: string;
}

export function PlMediaUploader({ onUploaded, accept = "image/*" }: PlMediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      setError(null);
      setUploading(true);
      try {
        for (const file of Array.from(files)) {
          const asset = await uploadMedia(file);
          onUploaded?.(asset);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "업로드 실패");
      } finally {
        setUploading(false);
      }
    },
    [onUploaded],
  );

  return (
    <div className="media-uploader">
      <div
        className={`media-uploader__dropzone${dragging ? " is-dragging" : ""}${uploading ? " is-uploading" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          hidden
          onChange={(e) => void handleFiles(e.target.files)}
        />
        {uploading ? (
          <p>업로드 중…</p>
        ) : (
          <>
            <p className="media-uploader__title">이미지를 드래그하거나 클릭하여 업로드</p>
            <p className="media-uploader__hint">JPG, PNG, WebP · 자동 WebP variants 생성</p>
          </>
        )}
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
