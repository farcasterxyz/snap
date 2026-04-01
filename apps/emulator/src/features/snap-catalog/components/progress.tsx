"use client";

import { Progress } from "@base-ui/react/progress";
import {
  ProgressTrack,
  ProgressIndicator,
  ProgressLabel,
} from "@neynar/ui/progress";
import type { PaletteColor } from "@farcaster/snap";
import { useSnapPalette } from "../hooks/useSnapAccent";

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
    <Progress.Root value={percent} className="flex w-full flex-col gap-1">
      {props.label != null ? (
        <ProgressLabel className="text-muted-foreground text-xs">
          {String(props.label)}
        </ProgressLabel>
      ) : null}
      <ProgressTrack>
        <ProgressIndicator
          className="transition-all"
          style={{ backgroundColor: fill }}
        />
      </ProgressTrack>
    </Progress.Root>
  );
}
