"use client";

import { AspectRatio } from "@neynar/ui/aspect-ratio";
import { cn } from "@neynar/ui/utils";
import { useSnapStackDirection } from "../stack-direction-context";

function aspectToRatio(aspect: string): number {
  const [w, h] = aspect.split(":").map(Number);
  if (!w || !h) return 1;
  return w / h;
}

export function SnapImage({
  element: { props },
}: {
  element: { props: Record<string, unknown> };
}) {
  const url = String(props.url ?? "");
  const alt = String(props.alt ?? "");
  const title = props.title ? String(props.title) : "";
  const subtitle = props.subtitle ? String(props.subtitle) : "";
  const hasOverlay = title.length > 0 || subtitle.length > 0;
  const ratio = aspectToRatio(String(props.aspect ?? "1:1"));
  const stackDir = useSnapStackDirection();
  const inHorizontalStack = stackDir === "horizontal";

  return (
    <AspectRatio
      ratio={ratio}
      className={cn(
        "relative overflow-hidden rounded-lg",
        inHorizontalStack ? "min-w-0 flex-1 basis-0" : "w-full"
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        className="absolute inset-0 size-full object-cover"
      />
      {hasOverlay && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/35 to-transparent p-3 pt-10 text-white">
          {title && (
            <div
              className="truncate text-sm font-semibold leading-5"
              style={{
                textShadow:
                  "0 1px 2px rgba(0,0,0,0.95), 0 0 3px rgba(0,0,0,0.9)",
                WebkitTextStroke: "0.25px rgba(0,0,0,0.75)",
              }}
            >
              {title}
            </div>
          )}
          {subtitle && (
            <div
              className="truncate text-xs font-medium leading-4 text-white/90"
              style={{
                textShadow:
                  "0 1px 2px rgba(0,0,0,0.95), 0 0 3px rgba(0,0,0,0.9)",
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      )}
    </AspectRatio>
  );
}
