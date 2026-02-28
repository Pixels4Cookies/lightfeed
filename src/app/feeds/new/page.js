import { AppShell } from "@/components/app-shell";
import { CreateNewsFeedExperience } from "@/components/create-news-feed-experience";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Create Feed",
  description: "Create a custom feed by combining RSS sources.",
};

export default function CreateFeedPage() {
  return (
    <AppShell>
      <CreateNewsFeedExperience />
    </AppShell>
  );
}
