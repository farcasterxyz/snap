import React from "react";
import { describe, expect, it } from "vitest";
import { getButtonContentOrientation } from "../src/button-orientation-utils.js";
import {
  childrenShouldUseHorizontalButtonLayout,
  getButtonChildLabels,
} from "../src/stack-horizontal-utils.js";

function button(label: string) {
  return React.createElement("div", {
    element: { type: "button", props: { label } },
  });
}

describe("button content orientation", () => {
  it("keeps short button content horizontal", () => {
    expect(getButtonContentOrientation(["Back", "Next"])).toBe("horizontal");
    expect(getButtonContentOrientation(["Yes", "No", "Maybe"])).toBe(
      "horizontal",
    );
    expect(getButtonContentOrientation(["A", "B", "C", "D"])).toBe(
      "horizontal",
    );
    expect(getButtonContentOrientation(["A", "B", "C", "D", "E"])).toBe(
      "horizontal",
    );
  });

  it("uses vertical layout when button content is too wide for a row", () => {
    expect(
      getButtonContentOrientation(["Create a new campaign", "View report"]),
    ).toBe("vertical");
    expect(
      getButtonContentOrientation(["Ethereum", "Optimism", "Base", "Arbitrum"]),
    ).toBe("vertical");
    expect(getButtonContentOrientation(["Yes", "No", "Maybe", "Later"])).toBe(
      "vertical",
    );
    expect(getButtonContentOrientation(["A", "B", "C", "D", "Later"])).toBe(
      "vertical",
    );
  });

  it("extracts direct button labels from catalog children", () => {
    expect(getButtonChildLabels([button("Save"), button("Cancel")])).toEqual([
      "Save",
      "Cancel",
    ]);
  });

  it("classifies all-button stacks by label content", () => {
    expect(
      childrenShouldUseHorizontalButtonLayout([button("Save"), button("Cancel")]),
    ).toBe(true);
    expect(
      childrenShouldUseHorizontalButtonLayout([
        button("Create a new campaign"),
        button("View analytics"),
      ]),
    ).toBe(false);
  });

  it("does not classify mixed stacks as button groups", () => {
    const text = React.createElement("div", {
      element: { type: "text", props: { value: "Hello" } },
    });
    expect(childrenShouldUseHorizontalButtonLayout([button("Save"), text])).toBe(
      undefined,
    );
  });
});
