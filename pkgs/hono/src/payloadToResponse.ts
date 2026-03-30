import {
  MEDIA_TYPE,
  rootSchema,
  type SnapResponse,
  validatePage,
} from "@farcaster/snap";

type PayloadToResponseOptions = {
  resourcePath: string;
  mediaTypes: string[];
};

export function payloadToResponse(
  payload: SnapResponse,
  options: PayloadToResponseOptions,
): Response {
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
      ...snapHeaders(MEDIA_TYPE, options.resourcePath, options.mediaTypes),
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

function buildSnapAlternateLinkHeader(
  resourcePath: string,
  mediaTypes: string[],
): string {
  const p = resourcePath.startsWith("/") ? resourcePath : `/${resourcePath}`;
  return mediaTypes
    .map((mediaType) => `<${p}>; rel="alternate"; type="${mediaType}"`)
    .join(", ");
}
