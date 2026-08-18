"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { PublicUnitType } from "@proplanding/shared";

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
  const floorplan = planSrc(unit);
  const specEntries = unit.specs
    ? Object.entries(unit.specs).filter(([, v]) => v != null && String(v).length > 0)
    : [];

  return (
    <section className="pl-unit-detail">
      <Link href={`/c/${slug}#pl-section-units`} className="pl-back">
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
            <Link href={`/c/${slug}#pl-section-inquiry`} className="pl-btn-primary">
              상담 신청
            </Link>
            <Link href={`/c/${slug}`} className="pl-btn-secondary">
              랜딩으로
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
        <div className="pl-lightbox" role="dialog" onClick={() => setZoomed(false)}>
          <button type="button" className="pl-lightbox__close" onClick={() => setZoomed(false)}>
            ✕
          </button>
          <div className="pl-lightbox__inner" onClick={(e) => e.stopPropagation()}>
            <Image src={floorplan} alt={`${unit.name} 평면도 확대`} width={1536} height={1024} />
            <p>{unit.name} · 확장형 평면도</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
