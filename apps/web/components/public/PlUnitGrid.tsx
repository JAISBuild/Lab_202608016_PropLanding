"use client";

import Link from "next/link";
import { useState } from "react";
import type { PublicUnitType } from "@proplanding/shared";
import { PlMark } from "./PlMark";

interface PlUnitGridProps {
  slug: string;
  units: PublicUnitType[];
  onUnitClick?: (code: string) => void;
}

function specText(unit: PublicUnitType, key: string) {
  const value = unit.specs?.[key];
  return typeof value === "string" ? value : "";
}

export function PlUnitGrid({ slug, units, onUnitClick }: PlUnitGridProps) {
  const featuredIndex = units.length > 1 ? 1 : 0;
  const [active, setActive] = useState(units[featuredIndex]?.id ?? units[0]?.id);

  return (
    <section id="pl-section-units" className="pl-units">
      <div className="pl-container">
        <div className="pl-units__head">
          <h2 className="pl-display">
            당신의 생활에 <PlMark>맞춘 세 가지 장면.</PlMark>
          </h2>
          <p>같은 주소, 다른 방식의 하루. 타입을 눌러 공간의 결을 비교해 보세요.</p>
        </div>
        <div className="pl-units__grid">
          {units.map((unit, index) => {
            const selected = unit.id === active;
            return (
              <article
                key={unit.id}
                className={`pl-units__card${selected ? " is-active" : ""}`}
                onMouseEnter={() => setActive(unit.id)}
                onFocus={() => setActive(unit.id)}
              >
                <p className="pl-units__type">TYPE {unit.code.toUpperCase()}</p>
                <p className="pl-units__area">
                  {unit.areaSqm ?? "?"}
                  <small>m²</small>
                </p>
                <h3>{specText(unit, "tagline") || unit.name}</h3>
                <p className="pl-units__meta">
                  {[specText(unit, "rooms"), specText(unit, "baths"), specText(unit, "note")]
                    .filter(Boolean)
                    .join(" · ") || unit.name}
                </p>
                <Link
                  href={`/c/${slug}/units/${unit.code}`}
                  className="pl-units__go"
                  onClick={() => onUnitClick?.(unit.code)}
                >
                  <span>{selected ? "현재 선택된 타입" : "눌러서 자세히 비교하기"}</span>
                  <i aria-hidden>↗</i>
                </Link>
                <span className="pl-units__index">{String(index + 1).padStart(2, "0")}</span>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
