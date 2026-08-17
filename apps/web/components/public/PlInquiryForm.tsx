"use client";

import { useMemo, useState } from "react";
import type { PublicLegalNotice } from "@proplanding/shared";
import { PlMark } from "./PlMark";

interface PlInquiryFormProps {
  legalNotices: PublicLegalNotice[];
  unitTypes: { id: string; name: string; areaSqm?: number | null }[];
  phone?: string | null;
  onSubmit: (data: {
    fullName: string;
    phone: string;
    email?: string;
    preferredVisitAt?: string;
    interestedUnitTypeId?: string;
    legalNoticeId: string;
  }) => Promise<void>;
}

function chipLabel(name: string, areaSqm?: number | null) {
  if (!areaSqm) return name;
  if (name.includes(String(areaSqm))) {
    return name.replace(/\s*타입$/, "");
  }
  return `${areaSqm}㎡`;
}

export function PlInquiryForm({ legalNotices, unitTypes, phone, onSubmit }: PlInquiryFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unitId, setUnitId] = useState(unitTypes[1]?.id ?? unitTypes[0]?.id ?? "");
  const privacy = legalNotices.find((l) => l.type === "privacy");
  const times = useMemo(
    () => ["10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"],
    [],
  );

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
    const date = String(fd.get("visitDate") || "");
    const time = String(fd.get("visitTime") || "");
    try {
      await onSubmit({
        fullName: String(fd.get("fullName")),
        phone: String(fd.get("phone")),
        email: String(fd.get("email") || "") || undefined,
        preferredVisitAt: date && time ? `${date}T${time}:00` : undefined,
        interestedUnitTypeId: unitId || undefined,
        legalNoticeId: privacy.id,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "제출 실패");
      setLoading(false);
    }
  }

  return (
    <section id="pl-section-inquiry" className="pl-consult">
      <div className="pl-consult__intro">
        <p className="pl-kicker pl-kicker--light">
          <span />
          START WITH A CONVERSATION
        </p>
        <h2 className="pl-display">
          나에게 맞는 결을 <PlMark>천천히 찾아보세요.</PlMark>
        </h2>
        <p>
          이름과 희망 방문 시간만 남겨 주세요. 관심 타입을 기준으로 다음 안내를 준비합니다.
        </p>
        <ul>
          <li>콘셉트 상담 10:00 — 18:00</li>
          {phone ? <li>{phone}</li> : null}
        </ul>
      </div>
      <form className="pl-consult__card" onSubmit={handleSubmit}>
        <div className="pl-consult__card-head">
          <span>VISIT RESERVATION</span>
          <span>01 — 04</span>
        </div>
        <h3>방문 상담 예약</h3>
        <div className="pl-consult__fields">
          <label>
            이름 *
            <input name="fullName" required placeholder="이름을 입력해 주세요" autoComplete="name" />
          </label>
          <label>
            휴대폰 번호 *
            <input name="phone" type="tel" required placeholder="010-0000-0000" autoComplete="tel" />
          </label>
          <label>
            희망 방문일 *
            <input name="visitDate" type="date" required />
          </label>
          <label>
            희망 시간 *
            <select name="visitTime" required defaultValue="14:00">
              {times.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>
        {unitTypes.length > 0 ? (
          <fieldset className="pl-chips">
            <legend>관심 타입</legend>
            <div>
              {unitTypes.map((u) => (
                <label key={u.id} className={unitId === u.id ? "is-on" : ""}>
                  <input
                    type="radio"
                    name="unitType"
                    value={u.id}
                    checked={unitId === u.id}
                    onChange={() => setUnitId(u.id)}
                  />
                  {chipLabel(u.name, u.areaSqm)}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}
        {privacy ? (
          <label className="pl-consult__agree">
            <input name="agree" type="checkbox" required />
            <span>
              {privacy.title}에 동의합니다. (필수)
              <small>예약 안내를 위한 최소한의 정보만 사용됩니다.</small>
            </span>
          </label>
        ) : null}
        {error ? <p className="pl-form__error">{error}</p> : null}
        <button type="submit" className="pl-btn-lime pl-btn-lime--block" disabled={loading}>
          {loading ? "보내는 중…" : "방문 상담 요청하기 →"}
        </button>
      </form>
    </section>
  );
}
