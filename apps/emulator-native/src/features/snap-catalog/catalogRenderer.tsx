import { createRenderer } from "@json-render/react-native";
import { snapJsonRenderCatalog } from "@farcaster/snap/ui";
import { SnapActionButton } from "./components/snap-action-button";
import { SnapButtonGroup } from "./components/snap-button-group";
import { SnapGrid } from "./components/snap-grid";
import { SnapDivider } from "./components/snap-divider";
import { SnapGroup } from "./components/snap-group";
import { SnapImage } from "./components/snap-image";
import { SnapList } from "./components/snap-list";
import { SnapNotSupported } from "./components/snap-not-supported";
import { SnapProgress } from "./components/snap-progress";
import { SnapSlider } from "./components/snap-slider";
import { SnapSpacer } from "./components/snap-spacer";
import { SnapStack } from "./components/snap-stack";
import { SnapText } from "./components/snap-text";
import { SnapTextInput } from "./components/snap-text-input";
import { SnapToggle } from "./components/snap-toggle";

/**
 * Maps snap json-render catalog types to React Native primitives (MVP).
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
  BarChart: SnapNotSupported,
  Group: SnapGroup,
  ActionButton: SnapActionButton,
});
