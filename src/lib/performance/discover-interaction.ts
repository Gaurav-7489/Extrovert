// Discover interaction policy: keep repeated user gestures independent.
// The UI owns the immediate optimistic transition; the server remains the
// source of truth and failures are reconciled back into the deck.
export const DISCOVER_RENDER_BUFFER = 2;
export const DISCOVER_ACTIONS = ["like", "pass"] as const;
