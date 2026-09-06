"use client";

import dynamic from "next/dynamic";

type BlockedProfile = { id: string; display_name: string; department: string };
type Subscription = { plan: string; status: string; currentPeriodEnd: string | null };

const DevicePreferences = dynamic(() => import("@/components/settings/device-preferences").then((m) => m.DevicePreferences), { ssr: false });
const CredentialsPanel = dynamic(() => import("./credentials-panel").then((m) => m.CredentialsPanel), { ssr: false });
const SettingsControls = dynamic(() => import("./settings-controls").then((m) => m.SettingsControls), { ssr: false });
const DeleteAccount = dynamic(() => import("./delete-account").then((m) => m.DeleteAccount), { ssr: false });

export function SettingsPanels({ currentEmail, hasPassword, initialGhostMode, blockedUsers, subscription, isPro }: { currentEmail: string; hasPassword: boolean; initialGhostMode: boolean; blockedUsers: BlockedProfile[]; subscription: Subscription; isPro: boolean }) {
  return <div className="space-y-3"><DevicePreferences />{hasPassword&&<CredentialsPanel currentEmail={currentEmail} hasPassword={hasPassword}/>}<SettingsControls initialGhostMode={initialGhostMode} blockedUsers={blockedUsers} isPro={isPro}/><DeleteAccount/></div>;
}
