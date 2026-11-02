import { describe, expect, test } from "bun:test";
import { JSDOM } from "jsdom";
import { resolveProductDocumentLink } from "./ProductCatalog";
import type { IProductCatalogView, IProductView } from "../products/source";

const product: IProductView = {
  id: "example",
  name: "Example",
  summary: "Example product",
  sections: [],
  documents: [
    {
      kind: "semantics",
      label: "Семантика",
      content: "# Семантика",
      sourcePath: "apps/studio/workspace/products/startup/example/semantics.md",
    },
  ],
};
const view: IProductCatalogView = {
  id: "startup",
  label: "startup",
  inherited: false,
  sourcePaths: [],
  products: [product],
};

describe("visible Studio document links", () => {
  test("opens ready Storybook links and document anchors in the manager, not a nested iframe", () => {
    const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
    const dom = new JSDOM("", {
      url: "http://localhost:4321/iframe.html?id=current&viewMode=story",
    });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: dom.window,
    });
    try {
      const ready =
        "/?path=/story/workspace-10-products-startup-example--semantics#спрос";
      expect(resolveProductDocumentLink(ready, view, product)).toEqual({
        href:
          new URL(ready, dom.window.location.href).pathname +
          new URL(ready, dom.window.location.href).search +
          new URL(ready, dom.window.location.href).hash,
        target: "_top",
      });
      expect(
        resolveProductDocumentLink(
          "/workspace-products/startup/example/semantics.md#спрос",
          view,
          product,
        ),
      ).toEqual({
        href: "/?path=%2Fstory%2Fworkspace-10-products-startup-example--semantics#%D1%81%D0%BF%D1%80%D0%BE%D1%81",
        target: "_top",
      });
      expect(
        resolveProductDocumentLink(
          "https://competitor.example/?path=/story/demo",
          view,
          product,
        ),
      ).toBe("https://competitor.example/?path=/story/demo");
      expect(() =>
        resolveProductDocumentLink(
          "/workspace-products/startup/example/hidden.md",
          view,
          product,
        ),
      ).toThrow("незарегистрированный исходник");
      expect(
        resolveProductDocumentLink(
          "/workspace-products/startup/example/logo.svg",
          view,
          product,
        ),
      ).toBe("/workspace-products/startup/example/logo.svg");
    } finally {
      if (previous) Object.defineProperty(globalThis, "window", previous);
      else Reflect.deleteProperty(globalThis, "window");
      dom.window.close();
    }
  });
});
