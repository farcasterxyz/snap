import {
  MEDIA_TYPE,
  type SnapHandlerResult,
  validateSnapResponse,
  snapResponseSchema,
} from "@farcaster/snap";

type PayloadToResponseOptions = {
  resourcePath: string;
  mediaTypes: string[];
};

const DEFAULT_LINK_MEDIA_TYPES = [MEDIA_TYPE, "text/html"] as const;

export function payloadToResponse(
  payload: SnapHandlerResult,
  options: Partial<PayloadToResponseOptions> = {},
): Response {
  const resourcePath = options.resourcePath ?? "/";
  const mediaTypes = options.mediaTypes ?? [...DEFAULT_LINK_MEDIA_TYPES];

  const validation = validateSnapResponse(payload);
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

  const finalized = snapResponseSchema.parse(payload);
  return new Response(JSON.stringify(finalized), {
    status: 200,
    headers: {
      ...snapHeaders(resourcePath, MEDIA_TYPE, mediaTypes),
    },
  });
}

export function snapHeaders(
  resourcePath: string,
  currentMediaType: string,
  availableMediaTypes: string[],
) {
  return {
    "Content-Type": `${currentMediaType}; charset=utf-8`,
    Vary: "Accept",
    Link: buildSnapAlternateLinkHeader(resourcePath, availableMediaTypes),
  };
}

export function buildSnapAlternateLinkHeader(
  resourcePath: string,
  mediaTypes: string[],
): string {
  const p = resourcePath.startsWith("/") ? resourcePath : `/${resourcePath}`;
  return mediaTypes
    .map((mediaType) => `<${p}>; rel="alternate"; type="${mediaType}"`)
    .join(", ");
}
