import { MEDIA_TYPE } from "@farcaster/snap";

/** Sent on every upstream snap fetch from the emulator proxy (matches `/api/snap` route). */
export const SNAP_UPSTREAM_ACCEPT = `${MEDIA_TYPE},text/html,*/*`;
