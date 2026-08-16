import { notFound } from "next/navigation";
import { fetchPublicCampaign } from "@/lib/api";
import { CampaignView } from "@/components/public/CampaignView";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}

export default async function CampaignPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const campaign = await fetchPublicCampaign(slug, preview);
  if (!campaign) notFound();

  return (
    <main>
      <CampaignView campaign={campaign} slug={slug} />
    </main>
  );
}
