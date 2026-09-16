# Extrovert launch review — 15 September 2026

## Release status

This branch fixes confirmed build, authentication, chat, layout, and database access defects. It is **not a complete production sign-off**. Changes to the web application still need deployment and the device checks below. The social-access migration has already been applied to the connected `datebu` Supabase project and verified.

## Changes

- Repaired the incomplete dependency lockfile and installed the missing Next.js ESLint configuration. Removed the accidental `%28auth%29` login route with broken imports.
- Removed the workflow that rewrote source and pushed commits on every main-branch update. Retained the manual debug APK workflow. Builds no longer rewrite UI source.
- Added the missing `/auth/confirm` endpoint, retained `/confirm` compatibility, routed standard PKCE email links through the code-exchange callback, and preserved password recovery for incomplete profiles.
- Preserved refreshed session cookies through middleware redirects, added private/no-store headers, prevented the banned-account login loop, and rejected backslash/control-character redirect destinations.
- Removed the outer height cap, placed bottom navigation inside the app layout, accounted for safe areas, restored pinch zoom, and removed brittle discovery overrides that hid swipe feedback and clipped card content. Added vertical touch scrolling on swipe cards and simplified the cramped homepage header/headline.
- Social chat now starts with the latest 100 messages instead of the oldest 100. Failed chat sends restore the draft; dating chat also removes ghost optimistic messages after thrown errors.
- Serialized concurrent encryption-key initialization and stopped silently replacing another device's public key. Added regression tests for key races, cross-device key preservation, encryption/decryption, and conversation binding.
- Database connection guards require pending requests, recipient consent, valid status transitions, available profiles, and no blocks. Social message policies recheck accepted connections, membership, bans, and blocks.
- Face verification now honors its existing disabled feature flag. Its browser-only assertions are insufficient to award a trustworthy badge, so both endpoints return a clear unavailable response.

## Evidence

- `npm ci --ignore-scripts --dry-run`: passes after lockfile repair.
- `npm run build`: passes, including static generation and route compilation.
- `npm run type-check`: passes.
- `npm run lint`: passes with one pre-existing anonymous-default-export warning in the push Edge Function.
- `npm test`: three passing cryptographic regression tests.
- Production-server HTTP smoke checks: home, login, register, reset-password, and manifest return 200; missing/invalid auth callbacks and protected pages redirect; disabled face endpoints return 503.
- Database rollback tests: direct accepted insertion rejected; self-accept rejected; recipient acceptance succeeds; accepted member can access chat; blocking removes access. Test changes rolled back.
- Supabase advisor after migration: no new warning category; existing authenticated SECURITY DEFINER notices and disabled leaked-password protection remain. Intentional privileged RPCs require individual review, not blanket revocation.
- Existing live homepage inspected in Chrome. The local preview is unreachable from the cloud browser; updated UI screenshots and actual-device behavior were not verified.
- Local, CI, and Vercel deployments target Node 24.

## Required before launch sign-off

1. Deploy the branch to a preview and complete signup, email confirmation, Google OAuth, password reset, onboarding, profile/photo editing, discovery, likes/matches, chat, blocks/reports, and account deletion with dedicated test accounts. No real account was deleted during this review.
2. Verify deployment server-only Supabase credentials, auth redirect allowlists, email templates/delivery, push configuration, and payment configuration. These were not available as local server credentials. Never place a service-role/secret key in a NEXT_PUBLIC variable.
3. Test an actual iPhone/Safari and Android/Chrome: keyboard/composer, safe areas, scrolling/swiping, image picker, PWA installation, notification permissions, and UPI app handoff. The existing APK workflow produces a debug Android wrapper, not a signed store release. No native iOS package is supplied.
4. Keep face verification disabled until trusted server-side liveness evidence is implemented. Previously issued browser-liveness badges were not reset by this change and should not be treated as proof of identity.
5. Encrypted history currently belongs to the original browser/device. Secure device transfer, recovery, and true multi-device key management are not implemented. The new guard preserves existing keys and explains the limitation instead of corrupting conversations.
6. Review remaining scope: social chat has no older-history pagination beyond its latest 100 messages; full payment completion and push delivery have not been exercised; repository migrations predate some live schema changes.

Supabase references: [SSR session handling](https://supabase.com/docs/guides/auth/server-side/advanced-guide), [privileged function advisor](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
