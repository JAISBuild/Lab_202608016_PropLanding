"use client";

import Image from "next/image";
import Link from "next/link";
import type { PublicUnitType } from "@proplanding/shared";

interface PlUnitGridProps {
  slug: string;
  units: PublicUnitType[];
  onUnitClick?: (code: string) => void;
}

export function PlUnitGrid({ slug, units, onUnitClick }: PlUnitGridProps) {
  return (
    <section id="pl-section-units" className="pl-units">
      <h2>타입 안내</h2>
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
                <Image src={unit.floorplanUrl} alt={unit.name} fill sizes="200px" />
              ) : (
                <div className="pl-units__placeholder">{unit.areaSqm ?? "?"}㎡</div>
              )}
            </div>
            <h3>{unit.name}</h3>
            {unit.areaSqm && <p>{unit.areaSqm}㎡</p>}
          </Link>
        ))}
      </div>
    </section>
  );
}
