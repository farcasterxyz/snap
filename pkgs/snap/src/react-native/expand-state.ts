export const SNAP_MAX_HEIGHT = 500;

export type SnapExpansionOptions = {
  contentHeight: number;
  internalExpanded: boolean;
  forceExpanded?: boolean;
  onExpandPress?: (() => void) | undefined;
  expandButtonLabel?: string | undefined;
  showOverflowWarning?: boolean | undefined;
};

export type SnapExpansionState = {
  expandable: boolean;
  clipped: boolean;
  showButton: boolean;
  buttonLabel: string;
  useInternalToggle: boolean;
  showOverflowWarning: boolean;
  maxHeight: number | undefined;
};

export function getSnapExpansionState({
  contentHeight,
  internalExpanded,
  forceExpanded = false,
  onExpandPress,
  expandButtonLabel,
  showOverflowWarning = false,
}: SnapExpansionOptions): SnapExpansionState {
  const hostControlled = typeof onExpandPress === "function";
  const overflowWarning = showOverflowWarning && !forceExpanded;
  const expandable =
    !forceExpanded && !overflowWarning && contentHeight > SNAP_MAX_HEIGHT + 1;
  const clipped = expandable && !internalExpanded;
  const showButton = expandable;
  const useInternalToggle = !hostControlled;

  return {
    expandable,
    clipped,
    showButton,
    buttonLabel:
      clipped && expandButtonLabel ? expandButtonLabel : internalExpanded ? "Show less" : "Show more",
    useInternalToggle,
    showOverflowWarning: overflowWarning,
    maxHeight: clipped ? SNAP_MAX_HEIGHT : undefined,
  };
}
