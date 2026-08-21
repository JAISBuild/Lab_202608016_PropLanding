interface PlSectionHeadProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  light?: boolean;
}

export function PlSectionHead({
  eyebrow,
  title,
  description,
  align = "left",
  light = false,
}: PlSectionHeadProps) {
  return (
    <div className={`pl-section-head pl-section-head--${align}${light ? " pl-section-head--light" : ""}`}>
      {eyebrow && <span className="pl-section-head__eyebrow">{eyebrow}</span>}
      <h2 className="pl-section-head__title">{title}</h2>
      {description && <p className="pl-section-head__desc">{description}</p>}
      <div className="pl-section-head__line" aria-hidden />
    </div>
  );
}
