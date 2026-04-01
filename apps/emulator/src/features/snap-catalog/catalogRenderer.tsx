"use client";

import { createRenderer } from "@json-render/react";
import { snapJsonRenderCatalog } from "@farcaster/snap/ui";
import { SnapActionButton } from "./components/action-button";
import { SnapBarChart } from "./components/bar-chart";
import { SnapButtonGroup } from "./components/button-group";
import { SnapDivider } from "./components/divider";
import { SnapGrid } from "./components/grid";
import { SnapGroup } from "./components/group";
import { SnapImage } from "./components/image";
import { SnapList } from "./components/list";
import { SnapProgress } from "./components/progress";
import { SnapSlider } from "./components/slider";
import { SnapSpacer } from "./components/spacer";
import { SnapStack } from "./components/stack";
import { SnapText } from "./components/text";
import { SnapTextInput } from "./components/text-input";
import { SnapToggle } from "./components/toggle";

/**
 * Maps snap json-render catalog types to React — Neynar UI where primitives exist
 * (typography, inputs, slider, switch, progress track, separator, button, toggle group),
 * same pattern as neynar-studio render-json.
 */
export const SnapCatalogView = createRenderer(snapJsonRenderCatalog, {
  Stack: SnapStack,
  Text: SnapText,
  Image: SnapImage,
  Divider: SnapDivider,
  Spacer: SnapSpacer,
  Progress: SnapProgress,
  List: SnapList,
  Grid: SnapGrid,
  TextInput: SnapTextInput,
  Slider: SnapSlider,
  Toggle: SnapToggle,
  ButtonGroup: SnapButtonGroup,
  BarChart: SnapBarChart,
  Group: SnapGroup,
  ActionButton: SnapActionButton,
});
