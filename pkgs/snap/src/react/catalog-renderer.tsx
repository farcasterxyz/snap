"use client";

import {
  JSONUIProvider,
  Renderer,
  type ComponentRegistry,
  type CreateRendererProps,
} from "@json-render/react";
import { useMemo, type ReactNode } from "react";
import { snapJsonRenderCatalog } from "@farcaster/snap/ui";
import { SnapActionButton } from "./components/action-button";
import { SnapBadge } from "./components/badge";
import { SnapIcon } from "./components/icon";
import { SnapImage } from "./components/image";
import { SnapInput } from "./components/input";
import { SnapItem } from "./components/item";
import { SnapItemGroup } from "./components/item-group";
import { SnapPaginator } from "./components/paginator";
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
const snapCatalogRegistry = {
  badge: SnapBadge,
  button: SnapActionButton,
  icon: SnapIcon,
  image: SnapImage,
  input: SnapInput,
  item: SnapItem,
  item_group: SnapItemGroup,
  paginator: SnapPaginator,
  progress: SnapProgress,
  separator: SnapSeparator,
  slider: SnapSlider,
  stack: SnapStack,
  switch: SnapSwitch,
  text: SnapText,
  toggle_group: SnapToggleGroup,
  bar_chart: SnapBarChart,
  cell_grid: SnapCellGrid,
} satisfies ComponentRegistry;

export function SnapCatalogView({
  spec,
  store,
  state,
  onAction,
  onStateChange,
  functions,
  loading,
  fallback,
  children,
}: CreateRendererProps & { children?: ReactNode }) {
  const actionHandlers = useMemo(
    () =>
      onAction
        ? new Proxy<Record<string, (params: Record<string, unknown>) => unknown>>(
            {},
            {
              get: (_target, prop) => {
                return (params: Record<string, unknown>) =>
                  onAction(String(prop), params);
              },
              has: () => true,
            },
          )
        : undefined,
    [onAction],
  );

  return (
    <JSONUIProvider
      registry={snapCatalogRegistry}
      store={store}
      initialState={state}
      handlers={actionHandlers}
      functions={functions}
      onStateChange={onStateChange}
    >
      <Renderer
        spec={spec}
        registry={snapCatalogRegistry}
        loading={loading}
        fallback={fallback}
      />
      {children}
    </JSONUIProvider>
  );
}
