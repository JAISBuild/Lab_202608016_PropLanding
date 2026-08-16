"use client";

import { useState } from "react";
import type { PublicLegalNotice } from "@proplanding/shared";

interface PlInquiryFormProps {
  legalNotices: PublicLegalNotice[];
  unitTypes: { id: string; name: string }[];
  onSubmit: (data: {
    fullName: string;
    phone: string;
    email?: string;
    interestedUnitTypeId?: string;
    legalNoticeId: string;
  }) => Promise<void>;
}

export function PlInquiryForm({ legalNotices, unitTypes, onSubmit }: PlInquiryFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const privacy = legalNotices.find((l) => l.type === "privacy");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const agreed = fd.get("agree") === "on";
    if (!agreed || !privacy) {
      setError("개인정보 동의가 필요합니다.");
      setLoading(false);
      return;
    }
    try {
      await onSubmit({
        fullName: String(fd.get("fullName")),
        phone: String(fd.get("phone")),
        email: String(fd.get("email") || "") || undefined,
        interestedUnitTypeId: String(fd.get("unitType") || "") || undefined,
        legalNoticeId: privacy.id,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "제출 실패");
      setLoading(false);
    }
  }

  return (
    <form id="pl-section-inquiry" className="pl-form" onSubmit={handleSubmit}>
      <h2>상담 신청</h2>
      <label>
        이름
        <input name="fullName" required placeholder="홍길동" />
      </label>
      <label>
        연락처
        <input name="phone" type="tel" required placeholder="010-0000-0000" />
      </label>
      <label>
        이메일 (선택)
        <input name="email" type="email" placeholder="email@example.com" />
      </label>
      {unitTypes.length > 0 && (
        <label>
          관심 타입
          <select name="unitType" defaultValue="">
            <option value="">선택</option>
            {unitTypes.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {privacy && (
        <label className="pl-form__agree">
          <input name="agree" type="checkbox" required />
          <span>
            <strong>{privacy.title}</strong>에 동의합니다
          </span>
        </label>
      )}
      {privacy && (
        <details className="pl-form__legal">
          <summary>약관 보기</summary>
          <p>{privacy.content}</p>
        </details>
      )}
      {error && <p className="pl-form__error">{error}</p>}
      <button type="submit" className="pl-form__submit" disabled={loading}>
        {loading ? "제출 중…" : "신청하기"}
      </button>
    </form>
  );
}
