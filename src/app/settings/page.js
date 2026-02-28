import { AppShell } from "@/components/app-shell";
import { ArchiveLinkSettingsControl } from "@/components/archive-link-settings-control";
import { ThemeSettingsControl } from "@/components/theme-settings-control";

export const metadata = {
  title: "Settings",
  description: "Manage application preferences and reading behavior.",
};

export default function SettingsPage() {
  return (
    <AppShell>
      <section className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-950 dark:text-stone-100">
          Settings
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-700 dark:text-stone-300">
          Global application controls will live here. The current view is a structural placeholder for privacy, refresh, and default-feed behavior.
        </p>
      </section>
      <section className="mb-6">
        <ThemeSettingsControl />
      </section>
      <section className="mb-6">
        <ArchiveLinkSettingsControl />
      </section>
    </AppShell>
  );
}
