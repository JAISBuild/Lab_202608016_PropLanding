import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchPublicCampaign } from "@/lib/api";
import { PlUnitDetail } from "@/components/public/PlUnitDetail";

interface PageProps {
  params: Promise<{ slug: string; code: string }>;
}

export default async function UnitPage({ params }: PageProps) {
  const { slug, code } = await params;
  const campaign = await fetchPublicCampaign(slug);
  if (!campaign) notFound();

  const unit = campaign.unitTypes.find((u) => u.code === code);
  if (!unit) notFound();

  return (
    <main className="pl-page">
      <PlUnitDetail slug={slug} unit={unit} />
      <div className="pl-page__actions">
        <Link href={`/c/${slug}#pl-section-inquiry`} className="pl-btn-primary">
          상담 신청
        </Link>
        <Link href={`/c/${slug}`} className="pl-btn-secondary">
          랜딩으로
        </Link>
      </div>
    </main>
  );
}
