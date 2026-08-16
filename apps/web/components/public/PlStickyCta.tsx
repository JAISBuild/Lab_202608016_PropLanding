"use client";

interface PlStickyCtaProps {
  phone?: string | null;
  onReserve: () => void;
  onRegister: () => void;
}

export function PlStickyCta({ phone, onReserve, onRegister }: PlStickyCtaProps) {
  return (
    <div className="pl-sticky-cta">
      {phone && (
        <a href={`tel:${phone.replace(/-/g, "")}`} className="pl-sticky-cta__btn pl-sticky-cta__call">
          전화
        </a>
      )}
      <button type="button" className="pl-sticky-cta__btn" onClick={onReserve}>
        방문예약
      </button>
      <button type="button" className="pl-sticky-cta__btn pl-sticky-cta__primary" onClick={onRegister}>
        상담신청
      </button>
    </div>
  );
}
