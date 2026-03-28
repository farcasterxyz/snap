/** Sent on every upstream snap fetch from the emulator proxy (matches `/api/snap` route). */
export const SNAP_UPSTREAM_ACCEPT =
  "application/json+farcaster-snap,text/html,*/*" as const;
