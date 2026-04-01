"use client";

import { cn } from "@neynar/ui/utils";

export function SnapList({
  element: { props },
}: {
  element: { props: Record<string, unknown> };
}) {
  const style = String(props.style ?? "ordered");
  const items = Array.isArray(props.items) ? props.items : [];
  const Wrapper =
    style === "unordered" ? "ul" : style === "ordered" ? "ol" : "ul";

  return (
    <Wrapper
      className={cn(
        "text-foreground m-0 list-inside space-y-1 pl-4 text-sm",
        style === "plain" && "list-none pl-0",
      )}
    >
      {items.map((item: { content?: string; trailing?: string }, i: number) => (
        <li
          key={i}
          className="flex items-baseline justify-between gap-2 marker:text-muted-foreground"
        >
          <span>{String(item.content ?? "")}</span>
          {item.trailing != null ? (
            <span className="text-muted-foreground text-[13px]">
              {String(item.trailing)}
            </span>
          ) : null}
        </li>
      ))}
    </Wrapper>
  );
}
