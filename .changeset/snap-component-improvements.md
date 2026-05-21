---
"@farcaster/snap": minor
---

Add v2 Snap component improvements for height-conscious layouts and richer media.

This release adds a v2-only `paginator` component for client-local page navigation. Paginators render one child page at a time, support optional built-in previous/next controls and indicators, support `controlsPosition: "top" | "bottom"` for placing the built-in pagination bar, and keep the active page entirely in renderer-local state so paginator movement is never included in POST inputs. Page changes use a small local slide/fade transition. Custom controls can bind normal `on.press` frontend actions with `paginator_next`, `paginator_previous`/`paginator_prev`, or `paginator_go_to`. For this release, a rendered snap supports one paginator, and paginator controls may live anywhere in the same snap.

Images now support `aspect: "4:1"` for compact banners, plus optional `title` and `subtitle` overlay props. These image overlay props are the intended abstraction for hero-like visuals in this pass; no separate `hero` component was added.

The v2 renderers now support more compact vertical layouts: buttons are shorter, default stack spacing and text line height are tighter, and text defaults to one visible line unless `maxLines` is provided. `text.props.maxLines` allows longer copy to opt into a bounded number of rendered lines.

`cell_grid` now supports `cellAspectRatio: "square"` plus tokenized `maxWidth: "sm" | "md" | "lg"` sizing. `sm` and `md` render centered constrained square grids for small board-like layouts, while `lg` and omitted `maxWidth` preserve the default full-width behavior.

The docs, llms guidance, catalog descriptions, validation tests, and example snaps were updated to cover paginator behavior, image overlays, compact text/layout rules, and centered square grid sizing.
