import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageSettingsExperience } from "@/components/page-settings-experience";
import { getPageById, listPageFeedMix } from "@/lib/lightfeed-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const page = getPageById(id);

  if (!page) {
    return {
      title: "Feed Not Found",
      description: "The requested feed does not exist.",
    };
  }

  return {
    title: `${page.name} Settings`,
    description: `Edit sources and options for ${page.name}.`,
  };
}

export default async function FeedEditPage({ params }) {
  const { id } = await params;
  const page = getPageById(id);

  if (!page) {
    notFound();
  }

  const feedMix = listPageFeedMix(page.id);

  return (
    <AppShell>
      <PageSettingsExperience page={page} feedMix={feedMix} />
    </AppShell>
  );
}
