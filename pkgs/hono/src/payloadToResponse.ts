import {
  MEDIA_TYPE,
  rootSchema,
  type SnapResponse,
  validatePage,
} from "@farcaster/snap";

/**
 * Validate a snap root object, then return a JSON Response for the client.
 * Sets `Content-Type: application/vnd.farcaster.snap+json` and `Vary: Accept`.
 *
 * On validation failure returns JSON `{ "error": "...", "issues": [...] }` with status 400.
 */
export function payloadToResponse(payload: SnapResponse): Response {
  const validation = validatePage(payload);
  if (!validation.valid) {
    return new Response(
      JSON.stringify({
        error: "invalid snap page",
        issues: validation.issues,
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      },
    );
  }

  const finalized = rootSchema.parse(payload);
  return new Response(JSON.stringify(finalized), {
    status: 200,
    headers: {
      "Content-Type": `${MEDIA_TYPE}; charset=utf-8`,
      Vary: "Accept",
    },
  });
}
