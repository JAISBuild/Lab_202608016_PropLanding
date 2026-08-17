interface PlSiteFooterProps {
  title: string;
  phone?: string | null;
}

export function PlSiteFooter({ title, phone }: PlSiteFooterProps) {
  return (
    <footer className="pl-footer">
      <div className="pl-container pl-footer__inner">
        <div className="pl-footer__brand">
          <p className="pl-footer__title">{title}</p>
          <p className="pl-footer__copy">© {new Date().getFullYear()} All rights reserved.</p>
        </div>
        {phone && (
          <div className="pl-footer__contact">
            <span className="pl-footer__label">분양 문의</span>
            <a href={`tel:${phone.replace(/-/g, "")}`}>{phone}</a>
          </div>
        )}
      </div>
    </footer>
  );
}
