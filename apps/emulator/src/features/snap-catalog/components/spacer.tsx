"use client";

export function SnapSpacer({
  element: { props },
}: {
  element: { props: Record<string, unknown> };
}) {
  const size = String(props.size ?? "medium");
  const className =
    size === "small" ? "h-1.5" : size === "large" ? "h-5" : "h-3";
  return <div className={className} />;
}
