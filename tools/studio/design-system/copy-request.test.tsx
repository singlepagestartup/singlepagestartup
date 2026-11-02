import { expect, test } from "bun:test";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { Component as WebsiteBuilderFeature } from "../../../apps/studio/modules/website-builder/feature";

test("copy request feedback follows the current record and ignores stale clipboard completions", async () => {
  const dom = new JSDOM("<div id='root'></div>", {
    url: "http://localhost:4321/iframe.html",
  });
  const globals: Record<string, unknown> = {
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    IS_REACT_ACT_ENVIRONMENT: true,
  };
  const previous = Object.fromEntries(
    Object.keys(globals).map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  );
  for (const [key, value] of Object.entries(globals))
    Object.defineProperty(globalThis, key, {
      configurable: true,
      writable: true,
      value,
    });
  let deferred = false;
  let completePending: () => void = () => {};
  const copied: string[] = [];
  Object.defineProperty(dom.window.navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: (text: string) => {
        copied.push(text);
        return deferred
          ? new Promise<void>((resolve) => {
              completePending = resolve;
            })
          : Promise.resolve();
      },
    },
  });
  const host = dom.window.document.getElementById("root")!;
  const root = createRoot(host);
  const render = (
    title: string,
    description: string,
    success = "Copied current request",
  ) =>
    act(async () =>
      root.render(
        <WebsiteBuilderFeature
          variant="copy-request"
          title={title}
          description={description}
          copyLabel="Copy supplied text"
          pendingLabel="Copy pending"
          successLabel={success}
          errorLabel="Copy failed"
          idleLabel="Review the supplied request"
        />,
      ),
    );
  const copy = () =>
    act(async () => host.querySelector<HTMLButtonElement>("button")!.click());
  try {
    await render("First request", "Current body");
    await copy();
    expect(copied).toEqual(["Current body"]);
    expect(host.querySelector('[role="status"]')?.textContent).toBe(
      "Copied current request",
    );

    await render("Renamed request", "Current body");
    expect(host.querySelector('[role="status"]')?.textContent).toBe(
      "Review the supplied request",
    );
    deferred = true;
    await copy();
    expect(host.querySelector("button")?.disabled).toBe(true);
    expect(host.textContent).toContain("Copy pending");
    await render("Replacement request", "Replacement body");
    expect(host.querySelector("button")?.disabled).toBe(false);
    await act(async () => completePending());
    expect(host.querySelector('[role="status"]')?.textContent).toBe(
      "Review the supplied request",
    );

    deferred = false;
    await copy();
    expect(copied.at(-1)).toBe("Replacement body");
    await render(
      "Replacement request",
      "Replacement body",
      "Updated success copy",
    );
    expect(host.querySelector('[role="status"]')?.textContent).toBe(
      "Updated success copy",
    );

    const copiedCount = copied.length;
    await render("Empty request", " \n ");
    expect(host.querySelector("button")?.disabled).toBe(true);
    await copy();
    expect(copied).toHaveLength(copiedCount);
    expect(host.querySelector('[role="status"]')?.textContent).toBe(
      "Review the supplied request",
    );
  } finally {
    await act(async () => root.unmount());
    for (const key of Object.keys(globals)) {
      if (previous[key]) Object.defineProperty(globalThis, key, previous[key]!);
      else Reflect.deleteProperty(globalThis, key);
    }
    dom.window.close();
  }
});
