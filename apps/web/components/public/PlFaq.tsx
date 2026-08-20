"use client";

import { useState } from "react";

export type FaqItem = { q: string; a: string };

const DEFAULT_FAQS: FaqItem[] = [
  {
    q: "방문 상담은 얼마나 걸리나요?",
    a: "보통 30–40분입니다. 관심 타입을 미리 고르시면 평면과 동선을 중심으로 더 편하게 안내합니다.",
  },
  {
    q: "계약금·중도금은 어떻게 되나요?",
    a: "캠페인마다 조건이 다릅니다. 상담 시 현재 적용 중인 계약금 비율과 중도금 일정을 명확히 말씀드립니다.",
  },
  {
    q: "관심 타입은 나중에 바꿔도 되나요?",
    a: "가능합니다. 예약 단계에서 고른 타입은 상담 우선순위일 뿐, 계약 전까지 언제든 다시 비교할 수 있습니다.",
  },
  {
    q: "개인정보는 어디에 쓰이나요?",
    a: "방문 안내와 상담 연락에만 사용합니다. 필수 동의 내용을 펼쳐 확인한 뒤 제출해 주세요.",
  },
];

interface PlFaqProps {
  headline?: string;
  items?: FaqItem[];
}

export function PlFaq({ headline, items }: PlFaqProps) {
  const faqs = items && items.length > 0 ? items : DEFAULT_FAQS;
  const [open, setOpen] = useState(0);

  return (
    <section id="pl-section-faq" className="pl-faq">
      <div className="pl-container pl-faq__grid">
        <div>
          <p className="pl-kicker pl-kicker--light">
            <span />
            QUESTIONS, ANSWERED
          </p>
          <h2 className="pl-display">
            {headline ? (
              <>
                {headline}
              </>
            ) : (
              <>
                알고 싶은 것부터 <em>확인하세요.</em>
              </>
            )}
          </h2>
          <p>결정하기 전, 가장 많이 묻는 질문을 짧게 정리했습니다.</p>
        </div>
        <div className="pl-faq__list">
          {faqs.map((item, i) => {
            const expanded = open === i;
            return (
              <div key={`${item.q}-${i}`} className={`pl-faq__item${expanded ? " is-open" : ""}`}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? -1 : i)}
                >
                  <strong>{String(i + 1).padStart(2, "0")}</strong>
                  <span>{item.q}</span>
                  <i aria-hidden>{expanded ? "−" : "+"}</i>
                </button>
                <div hidden={!expanded}>
                  <p>{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
