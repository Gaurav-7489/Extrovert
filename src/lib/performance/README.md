# Production interaction model

Extrovert's high-frequency interaction paths should follow this order:

1. Update local UI immediately.
2. Send the server mutation without blocking unrelated UI.
3. Treat realtime/server responses as reconciliation, not as the animation trigger.
4. Keep history and inbox reads bounded.
5. Never make a full route re-render part of a repeated interaction unless the visible data actually requires it.

Discover now keeps the active profile plus a rendered next-profile buffer and allows independent like/pass mutations. Each profile ID has its own in-flight guard so repeated taps cannot duplicate a mutation while unrelated swipes continue.
