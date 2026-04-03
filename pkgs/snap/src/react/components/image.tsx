"use client";

import { AspectRatio } from "@neynar/ui/aspect-ratio";

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

  return (
    <AspectRatio
      ratio={ratio}
      className="relative w-full flex-1 overflow-hidden rounded-lg"
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
