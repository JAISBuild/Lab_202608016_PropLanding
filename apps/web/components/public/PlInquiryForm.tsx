"use client";

import { useState } from "react";
import type { PublicLegalNotice } from "@proplanding/shared";
import { PlSectionHead } from "./PlSectionHead";

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
    <section id="pl-section-inquiry" className="pl-section pl-form-section">
      <div className="pl-container pl-form-section__grid">
        <div className="pl-form-section__intro">
          <PlSectionHead
            eyebrow="CONSULTATION"
            title="상담 신청"
            description="전문 상담사가 분양 정보와 방문 일정을 안내해 드립니다."
            light
          />
          <ul className="pl-form-section__points">
            <li>1:1 맞춤 분양 상담</li>
            <li>모델하우스 방문 예약</li>
            <li>관심 타입별 상세 안내</li>
          </ul>
        </div>
        <form className="pl-form" onSubmit={handleSubmit}>
          <label>
            <span>이름</span>
            <input name="fullName" required placeholder="홍길동" />
          </label>
          <label>
            <span>연락처</span>
            <input name="phone" type="tel" required placeholder="010-0000-0000" />
          </label>
          <label>
            <span>이메일 <em>(선택)</em></span>
            <input name="email" type="email" placeholder="email@example.com" />
          </label>
          {unitTypes.length > 0 && (
            <label>
              <span>관심 타입</span>
              <select name="unitType" defaultValue="">
                <option value="">선택해 주세요</option>
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
            {loading ? "제출 중…" : "상담 신청하기"}
          </button>
        </form>
      </div>
    </section>
  );
}
