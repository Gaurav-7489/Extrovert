# Extrovert performance hardening

The repeated interaction model is optimistic-first: render the next Discover card before the current server mutation finishes, keep like/pass requests independent by profile ID, and reconcile failed mutations back into the local deck. Route-wide invalidation is avoided on high-frequency actions.

Inbox and message-history database paths are indexed for their latest-row access patterns. The inbox itself should remain bounded; individual chats own their cursor-based history.
