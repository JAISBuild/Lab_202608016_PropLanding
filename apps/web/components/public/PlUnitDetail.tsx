"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { PublicUnitType } from "@proplanding/shared";

interface PlUnitDetailProps {
  slug: string;
  unit: PublicUnitType;
}

export function PlUnitDetail({ slug, unit }: PlUnitDetailProps) {
  const [zoomed, setZoomed] = useState(false);

  return (
    <section className="pl-unit-detail">
      <Link href={`/c/${slug}#pl-section-units`} className="pl-back">
        ← 타입 목록
      </Link>
      <h1>{unit.name}</h1>
      {unit.areaSqm && <p className="pl-unit-detail__area">{unit.areaSqm}㎡</p>}
      {unit.specs && (
        <ul className="pl-unit-detail__specs">
          {Object.entries(unit.specs).map(([k, v]) => (
            <li key={k}>
              <strong>{k}</strong>: {String(v)}
            </li>
          ))}
        </ul>
      )}
      {unit.floorplanUrl && (
        <button
          type="button"
          className="pl-unit-detail__floor"
          onClick={() => setZoomed(true)}
          aria-label="평면도 확대"
        >
          <Image src={unit.floorplanUrl} alt={`${unit.name} 평면도`} width={600} height={400} />
          <span>탭하여 확대</span>
        </button>
      )}
      {zoomed && unit.floorplanUrl && (
        <div className="pl-lightbox" role="dialog" onClick={() => setZoomed(false)}>
          <div className="pl-lightbox__inner" onClick={(e) => e.stopPropagation()}>
            <Image src={unit.floorplanUrl} alt="평면도 확대" width={1200} height={900} />
          </div>
        </div>
      )}
    </section>
  );
}
