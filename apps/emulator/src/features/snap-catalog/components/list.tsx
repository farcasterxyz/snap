"use client";

import { cn } from "@neynar/ui/utils";

/**
 * Native `::marker` is unreliable when `li` is `display: flex` (common browser bug).
 * Match native emulator: explicit bullet / number text.
 */
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
        "text-foreground m-0 list-none space-y-1 pl-0 text-sm",
        style === "plain" && "pl-0",
      )}
    >
      {items.map((item: { content?: string; trailing?: string }, i: number) => (
        <li key={i} className="flex items-baseline justify-between gap-2">
          <span className="flex min-w-0 flex-1 items-baseline gap-2">
            <span
              className="text-muted-foreground min-w-[20px] shrink-0 tabular-nums"
              aria-hidden={style !== "plain"}
            >
              {style === "ordered"
                ? `${i + 1}.`
                : style === "unordered"
                  ? "•"
                  : ""}
            </span>
            <span>{String(item.content ?? "")}</span>
          </span>
          {item.trailing != null ? (
            <span className="text-muted-foreground shrink-0 text-[13px]">
              {String(item.trailing)}
            </span>
          ) : null}
        </li>
      ))}
    </Wrapper>
  );
}
