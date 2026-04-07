import { createRenderer } from "@json-render/react-native";
import { snapJsonRenderCatalog } from "@farcaster/snap/ui";
import { SnapActionButton } from "./components/snap-action-button";
import { SnapBadge } from "./components/snap-badge";
import { SnapIcon } from "./components/snap-icon";
import { SnapImage } from "./components/snap-image";
import { SnapInput } from "./components/snap-input";
import { SnapItem } from "./components/snap-item";
import { SnapItemGroup } from "./components/snap-item-group";
import { SnapProgress } from "./components/snap-progress";
import { SnapSeparator } from "./components/snap-separator";
import { SnapSlider } from "./components/snap-slider";
import { SnapStack } from "./components/snap-stack";
import { SnapSwitch } from "./components/snap-switch";
import { SnapText } from "./components/snap-text";
import { SnapToggleGroup } from "./components/snap-toggle-group";
import { SnapBarChart } from "./components/snap-bar-chart";
import { SnapCellGrid } from "./components/snap-cell-grid";

/**
 * Maps snap json-render catalog types to React Native primitives.
 * Keys match the snap wire-format `type` strings exactly (snake_case).
 */
export const SnapCatalogView = createRenderer(snapJsonRenderCatalog, {
  badge: SnapBadge,
  button: SnapActionButton,
  icon: SnapIcon,
  image: SnapImage,
  input: SnapInput,
  item: SnapItem,
  item_group: SnapItemGroup,
  progress: SnapProgress,
  separator: SnapSeparator,
  slider: SnapSlider,
  stack: SnapStack,
  switch: SnapSwitch,
  text: SnapText,
  toggle_group: SnapToggleGroup,
  bar_chart: SnapBarChart,
  cell_grid: SnapCellGrid,
});
