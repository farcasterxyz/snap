import { encodePayload } from "@farcaster/snap/server";
import { NextRequest, NextResponse } from "next/server";
import type { SnapPayload } from "@farcaster/snap";
import {
  coerceUpstreamUrlToMatchCurrentSnap,
  parseSnapPayload,
  toAbsoluteSnapTarget,
} from "@/lib/snapProxyNormalize";
import { SNAP_UPSTREAM_ACCEPT } from "@/lib/snapUpstreamConstants";

async function readUpstreamJson(upstream: Response): Promise<unknown> {
  const text = await upstream.text();
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Snap response body is empty");
  }
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    const sample = trimmed.length > 200 ? `${trimmed.slice(0, 200)}…` : trimmed;
    throw new Error(
      `Snap response is not JSON (${
        upstream.headers.get("content-type") ?? "unknown type"
      }). Body: ${sample}`,
    );
  }
}

/** Read body after a non-OK upstream response; parse JSON when possible. */
async function readUpstreamErrorPayload(upstream: Response): Promise<{
  parsed: unknown | undefined;
  raw: string;
}> {
  const raw = await upstream.text();
  const trimmed = raw.trim();
  if (!trimmed) {
    return { parsed: undefined, raw: "" };
  }
  try {
    return { parsed: JSON.parse(trimmed) as unknown, raw: trimmed };
  } catch {
    return { parsed: undefined, raw: trimmed };
  }
}

function shortMessageFromUpstreamError(
  parsed: unknown,
  status: number,
  fallbackVerb: string,
): string {
  if (
    parsed &&
    typeof parsed === "object" &&
    !Array.isArray(parsed) &&
    typeof (parsed as { error?: unknown }).error === "string"
  ) {
    return (parsed as { error: string }).error;
  }
  return `${fallbackVerb} (${status})`;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json(
      { error: "Missing url query param" },
      { status: 400 },
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const fetchUrl = parsedUrl;

  try {
    const upstream = await fetch(fetchUrl.toString(), {
      headers: {
        Accept: SNAP_UPSTREAM_ACCEPT,
      },
      cache: "no-store",
    });

    if (!upstream.ok) {
      const { parsed, raw } = await readUpstreamErrorPayload(upstream);
      return NextResponse.json(
        {
          error: shortMessageFromUpstreamError(
            parsed,
            upstream.status,
            `Failed to load snap`,
          ),
          upstreamStatus: upstream.status,
          ...(parsed !== undefined ? { upstreamBody: parsed } : {}),
          ...(parsed === undefined && raw ? { upstreamBodyRaw: raw } : {}),
        },
        { status: 502 },
      );
    }

    const json = await readUpstreamJson(upstream);
    const snap = parseSnapPayload(json);

    return NextResponse.json({
      snap,
      _emulatorDebug: {
        upstreamSnapMethod: "GET",
        upstreamSnapUrl: fetchUrl.toString(),
        upstreamSnapHeaders: {
          Accept: SNAP_UPSTREAM_ACCEPT,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function normalizeUserFid(value: unknown): number {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value;
  }
  return 261319;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    currentUrl?: string;
    target?: string;
    buttonIndex?: number;
    inputs?: Record<string, unknown>;
    fid?: number;
  } | null;

  if (!body?.currentUrl || !body?.target) {
    return NextResponse.json(
      { error: "currentUrl and target are required" },
      { status: 400 },
    );
  }

  let currentSnapUrl: URL;
  let targetUrl: URL;
  try {
    currentSnapUrl = new URL(body.currentUrl);
    targetUrl = new URL(toAbsoluteSnapTarget(body.currentUrl, body.target));
    targetUrl = coerceUpstreamUrlToMatchCurrentSnap(targetUrl, currentSnapUrl);
  } catch {
    return NextResponse.json({ error: "Invalid target URL" }, { status: 400 });
  }

  const userFid = normalizeUserFid(body.fid);
  const timestamp = Math.floor(Date.now() / 1000);
  const payload: SnapPayload = {
    fid: userFid,
    inputs: (body.inputs ?? {}) as SnapPayload["inputs"],
    button_index: body.buttonIndex ?? 0,
    timestamp,
  };

  const jfsEnvelope = {
    header: "dev",
    payload: encodePayload(payload),
    signature: "dev",
  };
  const postBody = JSON.stringify(jfsEnvelope);
  const contentType = "application/json; charset=utf-8";

  try {
    const upstream = await fetch(targetUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": contentType,
        Accept: SNAP_UPSTREAM_ACCEPT,
      },
      body: postBody,
      cache: "no-store",
    });

    if (!upstream.ok) {
      const { parsed, raw } = await readUpstreamErrorPayload(upstream);
      return NextResponse.json(
        {
          error: shortMessageFromUpstreamError(
            parsed,
            upstream.status,
            `Snap interaction failed`,
          ),
          upstreamStatus: upstream.status,
          ...(parsed !== undefined ? { upstreamBody: parsed } : {}),
          ...(parsed === undefined && raw ? { upstreamBodyRaw: raw } : {}),
        },
        { status: 502 },
      );
    }

    const json = await readUpstreamJson(upstream);
    const snap = parseSnapPayload(json);

    return NextResponse.json({
      snap,
      _emulatorDebug: {
        upstreamSnapMethod: "POST",
        upstreamSnapUrl: targetUrl.toString(),
        upstreamSnapHeaders: {
          "Content-Type": contentType,
          Accept: SNAP_UPSTREAM_ACCEPT,
        },
        upstreamSnapBody: postBody,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
