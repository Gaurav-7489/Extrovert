"use client";

import dynamic from "next/dynamic";

type BlockedProfile = { id: string; display_name: string; department: string };
type Subscription = { plan: string; status: string; currentPeriodEnd: string | null };

const PanelSkeleton = () => (
  <div className="h-24 w-full animate-pulse rounded-[1.75rem] border border-zinc-200/90 bg-white/70 shadow-2xs transition-colors dark:border-white/10 dark:bg-[#121216]/70" />
);

const DevicePreferences = dynamic(
  () => import("@/components/settings/device-preferences").then((m) => m.DevicePreferences),
  { ssr: false, loading: () => <PanelSkeleton /> }
);
const CredentialsPanel = dynamic(
  () => import("./credentials-panel").then((m) => m.CredentialsPanel),
  { ssr: false, loading: () => <PanelSkeleton /> }
);
const SettingsControls = dynamic(
  () => import("./settings-controls").then((m) => m.SettingsControls),
  { ssr: false, loading: () => <PanelSkeleton /> }
);
const DeleteAccount = dynamic(
  () => import("./delete-account").then((m) => m.DeleteAccount),
  { ssr: false, loading: () => <PanelSkeleton /> }
);

export function SettingsPanels({
  currentEmail,
  hasPassword,
  initialGhostMode,
  blockedUsers,
  subscription,
  isPro,
}: {
  currentEmail: string;
  hasPassword: boolean;
  initialGhostMode: boolean;
  blockedUsers: BlockedProfile[];
  subscription: Subscription;
  isPro: boolean;
}) {
  void subscription;

  return (
    <div className="space-y-3.5 font-sans">
      <DevicePreferences />
      {hasPassword && (
        <CredentialsPanel currentEmail={currentEmail} hasPassword={hasPassword} />
      )}
      <SettingsControls
        initialGhostMode={initialGhostMode}
        blockedUsers={blockedUsers}
        isPro={isPro}
      />
      <DeleteAccount />
    </div>
  );
}