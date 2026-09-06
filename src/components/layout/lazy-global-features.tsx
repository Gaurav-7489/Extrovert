"use client";

import dynamic from "next/dynamic";

const InteractionFeedback = dynamic(
  () => import("@/components/ui/interaction-feedback").then((mod) => mod.InteractionFeedback),
  { ssr: false },
);
const WomenWelcome = dynamic(
  () => import("@/components/women-welcome").then((mod) => mod.WomenWelcome),
  { ssr: false },
);
const PushNotifications = dynamic(
  () => import("@/components/notifications/push-notifications").then((mod) => mod.PushNotifications),
  { ssr: false },
);
const MatchCelebration = dynamic(
  () => import("@/components/notifications/match-celebration").then((mod) => mod.MatchCelebration),
  { ssr: false },
);
const AppInstallPrompt = dynamic(
  () => import("@/components/install/app-install-prompt").then((mod) => mod.AppInstallPrompt),
  { ssr: false },
);

export function LazyGlobalFeatures() {
  return (
    <>
      <InteractionFeedback />
      <WomenWelcome />
      <PushNotifications />
      <MatchCelebration />
      <AppInstallPrompt />
    </>
  );
}
