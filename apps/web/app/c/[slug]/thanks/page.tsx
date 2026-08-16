import Link from "next/link";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string }>;
}

export default async function ThanksPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { type } = await searchParams;

  return (
    <main className="pl-thanks">
      <div className="pl-thanks__card">
        <h1>접수 완료</h1>
        <p>
          {type === "inquiry"
            ? "상담 신청이 정상적으로 접수되었습니다. 담당자가 곧 연락드리겠습니다."
            : "방문 예약이 접수되었습니다."}
        </p>
        <div className="pl-thanks__actions">
          <Link href={`/c/${slug}`} className="pl-btn-primary">
            홈으로
          </Link>
          <a href="tel:15880000" className="pl-btn-secondary">
            전화 상담
          </a>
        </div>
      </div>
    </main>
  );
}
