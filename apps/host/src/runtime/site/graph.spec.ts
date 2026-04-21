/**
 * BDD Suite: host site graph normalization.
 *
 * Given: the app-local runtime receives unsorted relation nodes and mixed slots.
 * When: the resolved page graph is normalized before rendering.
 * Then: page, layout, and external widget order follows orderIndex semantics.
 */

import { normalizeGraph } from "./graph";

describe("normalizeGraph", () => {
  it("sorts nested relations by orderIndex across the runtime graph", () => {
    const normalized = normalizeGraph({
      page: {
        id: "page-1",
        variant: "default",
      },
      layouts: [
        {
          relation: {
            id: "layout-rel-2",
            orderIndex: 2,
          },
          layout: {
            id: "layout-2",
            variant: "default",
          },
          defaultWidgets: [
            {
              slot: "layout-default",
              relation: { id: "layout-widget-2", orderIndex: 2 },
              widget: { id: "widget-2", variant: "default" },
              externalWidgets: [],
            },
            {
              slot: "layout-default",
              relation: { id: "layout-widget-1", orderIndex: 1 },
              widget: { id: "widget-1", variant: "default" },
              externalWidgets: [],
            },
          ],
          additionalWidgets: [],
        },
        {
          relation: {
            id: "layout-rel-1",
            orderIndex: 1,
          },
          layout: {
            id: "layout-1",
            variant: "default",
          },
          defaultWidgets: [],
          additionalWidgets: [],
        },
      ],
      pageWidgets: [
        {
          slot: "page",
          relation: { id: "page-widget-2", orderIndex: 2 },
          widget: { id: "page-widget-model-2", variant: "default" },
          externalWidgets: [],
        },
        {
          slot: "page",
          relation: { id: "page-widget-1", orderIndex: 1 },
          widget: { id: "page-widget-model-1", variant: "default" },
          externalWidgets: [],
        },
      ],
    } as any);

    expect(normalized.layouts.map((item) => item.layout.id)).toEqual([
      "layout-1",
      "layout-2",
    ]);

    expect(
      normalized.layouts[1].defaultWidgets.map((item) => item.widget.id),
    ).toEqual(["widget-1", "widget-2"]);

    expect(normalized.pageWidgets.map((item) => item.widget.id)).toEqual([
      "page-widget-model-1",
      "page-widget-model-2",
    ]);
  });
});
