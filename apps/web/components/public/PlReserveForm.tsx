"use client";

import { useState } from "react";
import type { PublicLegalNotice } from "@proplanding/shared";

interface PlReserveFormProps {
  legalNotices: PublicLegalNotice[];
  onSubmit: (data: {
    fullName: string;
    phone: string;
    preferredVisitAt: string;
    legalNoticeId: string;
  }) => Promise<void>;
}

export function PlReserveForm({ legalNotices, onSubmit }: PlReserveFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const privacy = legalNotices.find((l) => l.type === "privacy");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    if (fd.get("agree") !== "on" || !privacy) {
      setError("개인정보 동의가 필요합니다.");
      setLoading(false);
      return;
    }
    try {
      await onSubmit({
        fullName: String(fd.get("fullName")),
        phone: String(fd.get("phone")),
        preferredVisitAt: String(fd.get("visitAt")),
        legalNoticeId: privacy.id,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "예약 실패");
      setLoading(false);
    }
  }

  return (
    <form className="pl-form" onSubmit={handleSubmit}>
      <h2>방문 예약</h2>
      <label>
        이름
        <input name="fullName" required />
      </label>
      <label>
        연락처
        <input name="phone" type="tel" required />
      </label>
      <label>
        희망 방문 일시
        <input name="visitAt" type="datetime-local" required />
      </label>
      {privacy && (
        <label className="pl-form__agree">
          <input name="agree" type="checkbox" required />
          <span>{privacy.title}에 동의합니다</span>
        </label>
      )}
      {error && <p className="pl-form__error">{error}</p>}
      <button type="submit" className="pl-form__submit" disabled={loading}>
        {loading ? "예약 중…" : "예약하기"}
      </button>
    </form>
  );
}
