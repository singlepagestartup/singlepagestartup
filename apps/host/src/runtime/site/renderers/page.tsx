import { cn } from "@sps/shared-frontend-client-utils";

import { hostLayoutRegistry } from "../registries/layout";
import { HostPageRenderer } from "../types";
import { warnSiteRuntime } from "../warnings";
import { renderHostWidgetNodes } from "./shared";

export const renderHostPage: HostPageRenderer = async ({ context, graph }) => {
  const pageWidgets = await renderHostWidgetNodes(graph.pageWidgets, context);

  const renderedLayouts = await Promise.all(
    graph.layouts.map(async (node, index) => {
      const renderer = hostLayoutRegistry[node.layout.variant];

      if (!renderer) {
        warnSiteRuntime(
          `Unsupported host layout variant "${node.layout.variant}" for layout "${node.layout.id}".`,
        );
        return null;
      }

      return await renderer({
        context,
        node,
        children: (
          <div data-module="host" data-model="page-widgets">
            {pageWidgets}
          </div>
        ),
      });
    }),
  );

  return (
    <div
      data-module="host"
      data-model="page"
      data-id={graph.page.id || ""}
      data-variant={graph.page.variant}
      className={cn("w-full flex flex-col", graph.page.className)}
    >
      {renderedLayouts.map((layout, index) => {
        return layout ? (
          <div key={graph.layouts[index]?.relation.id || index}>{layout}</div>
        ) : null;
      })}
    </div>
  );
};
