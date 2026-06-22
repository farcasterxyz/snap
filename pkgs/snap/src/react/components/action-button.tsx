"use client";

import { useMemo, useState } from "react";
import { useStateStore, useStateValue } from "@json-render/react";
import { ExternalLink } from "lucide-react";
import { Button } from "@neynar/ui/button";
import { cn } from "@neynar/ui/utils";
import { useSnapColors } from "../hooks/use-snap-colors";
import {
  getPaginatorAction,
  runPaginatorAction,
} from "../../ui/paginator-state";
import { buildActionActivityStateChanges } from "../../render-state";
import { useSnapStackDirection } from "../stack-direction-context";
import { ICON_MAP } from "./icon";

function isExternalLinkAction(
  on: Record<string, unknown> | undefined,
): boolean {
  if (!on) return false;
  const press = on.press as
    | { action?: string; params?: Record<string, unknown> }
    | undefined;
  if (!press) return false;
  return press.action === "open_url";
}

function getActionPendingPath(on: Record<string, unknown> | undefined) {
  const press = on?.press as
    | { action?: unknown; params?: Record<string, unknown> }
    | undefined;
  if (!press?.action) return "/__snap/action/pending";

  return (
    buildActionActivityStateChanges({
      actionName: press.action,
      params: press.params ?? {},
      pending: true,
    }).find((change) => change.path.endsWith("/pending"))?.path ??
    "/__snap/action/pending"
  );
}

export function SnapActionButton({
  element,
  emit,
}: {
  element: {
    props: Record<string, unknown>;
    on?: Record<string, unknown>;
  };
  emit: (name: string) => void;
}) {
  const { props } = element;
  const label = String(props.label ?? "Action");
  const variant = String(props.variant ?? "secondary");
  const isPrimary = variant === "primary";
  const disabled = props.disabled === true;
  const iconName = props.icon ? String(props.icon) : undefined;
  const colors = useSnapColors();
  const [hovered, setHovered] = useState(false);
  const stateStore = useStateStore();
  const paginatorAction = getPaginatorAction(element.on);
  const actionPendingPath = useMemo(
    () => getActionPendingPath(element.on),
    [element.on],
  );
  const actionPending = useStateValue(actionPendingPath) === true;

  const Icon = iconName ? ICON_MAP[iconName] : undefined;
  const showExternalIcon = isExternalLinkAction(element.on);
  const inHorizontalStack = useSnapStackDirection() === "horizontal";

  const style = {
    cursor: disabled ? ("not-allowed" as const) : ("pointer" as const),
    opacity: disabled ? 0.62 : 1,
    ...(isPrimary
      ? {
          backgroundColor: hovered ? colors.accentHover : colors.accent,
          color: colors.accentFg,
          borderColor: "transparent",
        }
      : {
          backgroundColor: hovered
            ? `color-mix(in srgb, ${colors.accent} 15%, transparent)`
            : colors.muted,
          color: colors.text,
          borderColor: "transparent",
        }),
  };

  return (
    /**
     * In a horizontal stack, `flex-auto` lets the row fill available width while
     * preserving content-proportional button widths. In a vertical stack, flex
     * growth would silently stretch button height; stick to `w-full`.
     */
    <div
      className={
        inHorizontalStack
          ? "min-w-0 flex-auto"
          : "w-full min-w-0"
      }
      style={inHorizontalStack ? { flex: "1 1 auto" } : undefined}
    >
      <Button
        type="button"
        variant={isPrimary ? "default" : "secondary"}
        className={cn("h-8 w-full gap-2 px-3 text-sm")}
        disabled={disabled}
        style={style}
        onClick={() => {
          if (disabled) return;
          if (!runPaginatorAction(stateStore, paginatorAction)) {
            emit("press");
          }
        }}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        {Icon && <Icon size={16} />}
        {label}
        {actionPending && (
          <span data-snap-action-pending-active="true" hidden />
        )}
        {showExternalIcon && (
          <ExternalLink size={14} style={{ opacity: 0.6 }} />
        )}
      </Button>
    </div>
  );
}
