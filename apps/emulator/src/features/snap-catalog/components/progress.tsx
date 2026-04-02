"use client";

import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import type { PaletteColor } from "@farcaster/snap";
import { useSnapPalette } from "../hooks/useSnapAccent";

/**
 * Use Base UI progress parts from a single module only. Mixing `@neynar/ui/progress`
 * subcomponents with `Progress.Root` from another resolution of `@base-ui/react/progress`
 * can split React context (pnpm) and trigger "ProgressRootContext is missing".
 */
export function SnapProgress({
  element: { props },
}: {
  element: { props: Record<string, unknown> };
}) {
  const { hex, map } = useSnapPalette();
  const value = Number(props.value ?? 0);
  const max = Math.max(1, Number(props.max ?? 100));
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const semantic = String(props.color ?? "accent");
  const hasSemantic = Object.prototype.hasOwnProperty.call(
    map,
    semantic as PaletteColor,
  );
  const fill =
    semantic === "accent" || !hasSemantic ? "var(--primary)" : hex(semantic);

  return (
    <ProgressPrimitive.Root
      value={percent}
      className="flex w-full flex-col gap-1"
      data-slot="progress"
    >
      {props.label != null ? (
        <ProgressPrimitive.Label
          className="text-muted-foreground text-xs"
          data-slot="progress-label"
        >
          {String(props.label)}
        </ProgressPrimitive.Label>
      ) : null}
      <ProgressPrimitive.Track
        className="bg-muted relative flex h-1.5 w-full items-center overflow-x-hidden rounded-full"
        data-slot="progress-track"
      >
        <ProgressPrimitive.Indicator
          className="h-full transition-all"
          data-slot="progress-indicator"
          style={{ backgroundColor: fill }}
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  );
}
