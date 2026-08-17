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
        {phone && (
          <a href={`tel:${phone.replace(/-/g, "")}`} className="pl-sticky-cta__btn pl-sticky-cta__call">
            <span className="pl-sticky-cta__icon" aria-hidden>☎</span>
            전화상담
          </a>
        )}
        <button type="button" className="pl-sticky-cta__btn" onClick={onReserve}>
          방문예약
        </button>
        <button type="button" className="pl-sticky-cta__btn pl-sticky-cta__primary" onClick={onRegister}>
          상담신청
        </button>
      </div>
    </div>
  );
}
