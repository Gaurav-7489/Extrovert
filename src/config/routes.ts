/** Application route constants — single source of truth. */
export const routes = {
  home: "/", about: "/about", safety: "/safety", privacy: "/privacy", terms: "/terms",
  login: "/login", register: "/register", onboarding: "/onboarding", verify: "/verify", identityVerification: "/verification", verifyFace: "/verification", resetPassword: "/reset-password",
  app: "/app", social: "/app/social", discover: "/app/discover", matches: "/app/matches", messages: "/app/messages", likes: "/app/likes",
  profile: "/app/profile", profileViews: "/app/profile/views", profileInsights: "/app/profile/insights", profileView: "/app/profile/view", dashboard: "/app/dashboard", profilePreferences: "/app/profile/preferences", profileSetup: "/app/profile/setup", settings: "/app/settings", feedback: "/app/feedback", support: "/app/support", extrovert: "/app/extrovert", shop: "/app/shop", news: "/news",
  admin: { root: "/admin", users: "/admin/users", reports: "/admin/reports", moderation: "/admin/moderation", verification: "/admin/verification", analytics: "/admin/analytics", settings: "/admin/settings", auditLogs: "/admin/audit-logs", news: "/admin/news" },
} as const;
