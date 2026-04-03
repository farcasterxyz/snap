import {
  MEDIA_TYPE,
  type SnapHandlerResult,
  validateSnapResponse,
  snapResponseSchema,
} from "@farcaster/snap";
import { snapJsonRenderCatalog } from "@farcaster/snap/ui";

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

  // Validate snap envelope (version, theme, effects, ui shape)
  const validation = validateSnapResponse(payload);
  if (!validation.valid) {
    return errorResponse("invalid snap page", validation.issues);
  }

  // Validate ui against catalog (element types, props, actions)
  const catalogResult = snapJsonRenderCatalog.validate(payload.ui);
  if (!catalogResult.success) {
    const issues = catalogResult.error?.issues ?? [];
    return errorResponse("invalid snap ui", issues);
  }

  const finalized = snapResponseSchema.parse(payload);
  return new Response(JSON.stringify(finalized), {
    status: 200,
    headers: {
      ...snapHeaders(resourcePath, MEDIA_TYPE, mediaTypes),
    },
  });
}

function errorResponse(error: string, issues: unknown[]): Response {
  return new Response(
    JSON.stringify({ error, issues }),
    {
      status: 400,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    },
  );
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
