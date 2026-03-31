"use client";

import type { ReactNode } from "react";

/**
 * Row / grid layouts for snap buttons. ActionButtons use `w-full`; in a flex row
 * that would each resolve to 100% of the container and overflow (clipped by the
 * preview card). Use flex-1 / grid cells so every button stays visible.
 * Grid layout: one column when the snap card is narrow (`@container` + `@sm:grid-cols-2`).
 */
export function SnapGroup({
  element: { props },
  children,
}: {
  element: { props: Record<string, unknown> };
  children?: ReactNode;
}) {
  const layout = props.layout === "grid" ? "grid" : "row";

  if (layout === "grid") {
    return (
      <div className="@container w-full min-w-0">
        <div className="grid w-full grid-cols-1 gap-2 @sm:grid-cols-2 justify-items-stretch *:min-w-0 *:w-full">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-row flex-wrap items-stretch gap-2 *:min-w-0 *:basis-0 *:flex-1">
      {children}
    </div>
  );
}
