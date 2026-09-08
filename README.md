# Extrovert

> Connect your vibe, friends and more.

Extrovert is one app, one account and one identity with social and optional dating experiences.

## Product model

- Google Sign-In is the primary account entry point.
- Face verification and area verification are optional trust signals.
- Unverified users retain full access.
- Face verification is a live-camera liveness check and does not require a government ID or document.
- Raw verification camera data remains private; profiles expose only verification status.
- Supported launch areas: Waknaghat, Solan and Shimla.
- Exact coordinates are never exposed to other users.
- Changing the selected area requires area verification again.
- Verified face/area profiles receive higher discovery priority.
- Users can use Social only, Dating only, or Both; social-only users are not forced through dating setup.

## Social

The Social home is the default in-app landing experience. It uses the selected area for local discovery, shows trust signals without exposing private verification data, and keeps connection/chat actions inside the same Extrovert account.

## Dating

Discovery, preferences, likes, passes, matches, match celebration, chat, unmatch, block, report, Super Likes and Beyond.

## Trust architecture

Face verification results live in a private database schema and are protected by row-level security. Public-facing profile data contains trust state only. Area verification stores the selected area and verification result without exposing exact coordinates to other users.

## Performance

The app is mobile-first and optimized for a high-refresh-rate feel: parallel server data fetching, small discovery batches, cached/optimized profile images, indexed trust/area queries, lightweight loading UI, optimistic interaction states, minimal client work and clear recoverable errors.

## Technology

Next.js 15 App Router · React 19 · TypeScript · Tailwind CSS · Supabase PostgreSQL/Auth/Storage/Realtime · Vercel.
