"use client";

import { createRenderer } from "@json-render/react";
import { snapJsonRenderCatalog } from "@farcaster/snap/ui";
import { SnapActionButton } from "./components/action-button";
import { SnapBadge } from "./components/badge";
import { SnapIcon } from "./components/icon";
import { SnapImage } from "./components/image";
import { SnapInput } from "./components/input";
import { SnapItem } from "./components/item";
import { SnapItemGroup } from "./components/item-group";
import { SnapProgress } from "./components/progress";
import { SnapSeparator } from "./components/separator";
import { SnapSlider } from "./components/slider";
import { SnapStack } from "./components/stack";
import { SnapSwitch } from "./components/switch";
import { SnapText } from "./components/text";
import { SnapToggleGroup } from "./components/toggle-group";
import { SnapBarChart } from "./components/bar-chart";
import { SnapCellGrid } from "./components/cell-grid";

/**
 * Maps snap json-render catalog types to React components.
 * Keys match the snap wire-format `type` strings exactly.
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
