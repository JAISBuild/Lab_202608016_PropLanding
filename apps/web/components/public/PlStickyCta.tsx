"use client";

interface PlStickyCtaProps {
  phone?: string | null;
  onReserve: () => void;
  onRegister: () => void;
}

export function PlStickyCta({ phone, onReserve, onRegister }: PlStickyCtaProps) {
  return (
    <div className="pl-sticky-cta">
      <div className="pl-sticky-cta__inner">
        {phone ? (
          <a href={`tel:${phone.replace(/-/g, "")}`} className="pl-sticky-cta__call">
            전화
          </a>
        ) : null}
        <button type="button" className="pl-sticky-cta__ghost" onClick={onReserve}>
          방문
        </button>
        <button type="button" className="pl-sticky-cta__lime" onClick={onRegister}>
          상담 예약
        </button>
      </div>
    </div>
  );
}
