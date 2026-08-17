"use client";

import Image from "next/image";
import Link from "next/link";
import type { PublicUnitType } from "@proplanding/shared";
import { PlSectionHead } from "./PlSectionHead";

interface PlUnitGridProps {
  slug: string;
  units: PublicUnitType[];
  onUnitClick?: (code: string) => void;
}

export function PlUnitGrid({ slug, units, onUnitClick }: PlUnitGridProps) {
  return (
    <section id="pl-section-units" className="pl-section pl-section--alt pl-units">
      <div className="pl-container">
        <PlSectionHead
          eyebrow="UNIT PLAN"
          title="타입 안내"
          description="라이프스타일에 맞는 평면을 선택하고 상세 도면을 확인하세요."
        />
        <div className="pl-units__grid">
          {units.map((unit) => (
            <Link
              key={unit.id}
              href={`/c/${slug}/units/${unit.code}`}
              className="pl-units__card"
              onClick={() => onUnitClick?.(unit.code)}
            >
              <div className="pl-units__thumb">
                {unit.floorplanUrl ? (
                  <Image src={unit.floorplanUrl} alt={unit.name} fill sizes="(max-width:768px) 50vw, 300px" />
                ) : (
                  <div className="pl-units__placeholder">
                    <span>{unit.areaSqm ?? "?"}</span>
                    <small>㎡</small>
                  </div>
                )}
              </div>
              <div className="pl-units__body">
                <h3>{unit.name}</h3>
                {unit.areaSqm && <p className="pl-units__area">{unit.areaSqm}㎡</p>}
                <span className="pl-units__link">평면도 보기 →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
