"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { PublicUnitType } from "@proplanding/shared";
import { setLandingReturn } from "@/lib/landing-scroll";
import { useHistoryLayer } from "@/lib/use-history-layer";

interface PlUnitDetailProps {
  slug: string;
  unit: PublicUnitType;
}

const SPEC_LABELS: Record<string, string> = {
  note: "특징",
  rooms: "구성",
  baths: "욕실",
  tagline: "구조",
};

const LOCAL_FLOORPLANS: Record<string, string> = {
  "59a": "/images/floor-59a.jpg",
  "84a": "/images/floor-84a.jpg",
  "101b": "/images/floor-101b.jpg",
};

function planSrc(unit: PublicUnitType) {
  if (LOCAL_FLOORPLANS[unit.code]) return LOCAL_FLOORPLANS[unit.code];
  const remote = unit.floorplanUrl;
  if (!remote) return null;
  if (remote.includes("localhost:4000") || remote.includes("127.0.0.1:4000")) return null;
  return remote;
}

export function PlUnitDetail({ slug, unit }: PlUnitDetailProps) {
  const [zoomed, setZoomed] = useState(false);
  useHistoryLayer(zoomed, () => setZoomed(false));
  const floorplan = planSrc(unit);
  const specEntries = unit.specs
    ? Object.entries(unit.specs).filter(([, v]) => v != null && String(v).length > 0)
    : [];

  const goBackToUnits = () => setLandingReturn(slug, "pl-section-units");
  const goToInquiry = () => setLandingReturn(slug, "pl-section-inquiry");

  return (
    <section className="pl-unit-detail">
      <Link href={`/c/${slug}`} scroll={false} className="pl-back" onClick={goBackToUnits}>
        ← 타입 목록
      </Link>
      <div className={`pl-unit-detail__layout${floorplan ? " has-plan" : ""}`}>
        <div className="pl-unit-detail__copy">
          <p className="pl-unit-detail__kicker">TYPE {unit.code.toUpperCase()}</p>
          <h1>{unit.name}</h1>
          {unit.areaSqm ? <p className="pl-unit-detail__area">전용 {unit.areaSqm}㎡</p> : null}
          {specEntries.length > 0 ? (
            <ul className="pl-unit-detail__specs">
              {specEntries.map(([k, v]) => (
                <li key={k}>
                  <span>{SPEC_LABELS[k] ?? k}</span>
                  {String(v)}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="pl-page__actions">
            <Link href={`/c/${slug}`} scroll={false} className="pl-btn-primary" onClick={goToInquiry}>
              상담 신청
            </Link>
            <Link href={`/c/${slug}`} scroll={false} className="pl-btn-secondary" onClick={goBackToUnits}>
              돌아가기
            </Link>
          </div>
        </div>
        {floorplan ? (
          <button
            type="button"
            className="pl-unit-detail__floor"
            onClick={() => setZoomed(true)}
            aria-label={`${unit.name} 평면도 확대`}
          >
            <Image
              src={floorplan}
              alt={`${unit.name} 확장형 평면도`}
              width={1536}
              height={1024}
              className="pl-unit-detail__floor-img"
              priority
            />
            <span>확장형 · 탭하여 확대</span>
          </button>
        ) : null}
      </div>
      {zoomed && floorplan ? (
        <div
          className="pl-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${unit.name} 평면도 확대 보기`}
          onClick={() => setZoomed(false)}
        >
          <button
            type="button"
            className="pl-lightbox__close"
            aria-label="축소하여 닫기"
            onClick={() => setZoomed(false)}
          >
            ✕
          </button>
          <button
            type="button"
            className="pl-lightbox__inner pl-lightbox__inner--plan"
            onClick={() => setZoomed(false)}
            aria-label="이미지 클릭하여 축소"
          >
            <Image
              src={floorplan}
              alt={`${unit.name} 평면도 확대`}
              width={1536}
              height={1024}
              className="pl-lightbox__img"
            />
            <p>{unit.name} · 확장형 · 탭하여 축소</p>
          </button>
        </div>
      ) : null}
    </section>
  );
}
