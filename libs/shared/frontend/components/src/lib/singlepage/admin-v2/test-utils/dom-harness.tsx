import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";

export type TDomHarness = {
  container: HTMLDivElement;
  root: Root;
};

export function createDomHarness(): TDomHarness {
  const container = document.createElement("div");
  document.body.appendChild(container);

  return {
    container,
    root: createRoot(container),
  };
}

export function renderInHarness(harness: TDomHarness, node: React.ReactNode) {
  act(() => {
    harness.root.render(node);
  });
}

export function cleanupHarness(harness: TDomHarness) {
  act(() => {
    harness.root.unmount();
  });
  harness.container.remove();
}

export function enableReactActEnvironment() {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
}
