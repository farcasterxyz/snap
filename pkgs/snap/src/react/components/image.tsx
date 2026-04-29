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
  const ratio = aspectToRatio(String(props.aspect ?? "1:1"));
  const stackDir = useSnapStackDirection();
  const inHorizontalStack = stackDir === "horizontal";

  return (
    <AspectRatio
      ratio={ratio}
      className={cn(
        "relative overflow-hidden rounded-lg",
        inHorizontalStack ? "min-w-0 flex-1 basis-0" : "w-full",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        className="absolute inset-0 size-full object-cover"
      />
    </AspectRatio>
  );
}
