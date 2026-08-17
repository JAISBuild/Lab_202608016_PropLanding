interface PlSiteFooterProps {
  title: string;
  phone?: string | null;
}

export function PlSiteFooter({ title, phone }: PlSiteFooterProps) {
  return (
    <footer className="pl-footer">
      <div className="pl-container pl-footer__inner">
        <div className="pl-footer__brand">
          <span className="pl-header__mark" aria-hidden>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path
                d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div>
            <p className="pl-footer__title">{title}</p>
            <p className="pl-footer__study">FICTIONAL PROJECT STUDY</p>
            <p className="pl-footer__copy">
              특정 분양 사이트를 복제한 화면이 아닙니다. 캠페인 랜딩의 읽기 편한 결을 보여 주기 위한 데모입니다.
            </p>
          </div>
        </div>
        <div className="pl-footer__side">
          {phone ? (
            <a href={`tel:${phone.replace(/-/g, "")}`} className="pl-footer__phone">
              {phone}
            </a>
          ) : null}
          <a href="#pl-section-hero" className="pl-text-link pl-text-link--lime">
            처음으로 돌아가기 ↑
          </a>
        </div>
      </div>
    </footer>
  );
}
