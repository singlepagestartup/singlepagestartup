import { cn } from "@sps/shared-frontend-client-utils";

import { HostLayoutRenderer } from "../types";
import { renderHostWidgetNodes } from "./shared";

export const renderHostLayout: HostLayoutRenderer = async ({
  children,
  context,
  node,
}) => {
  const defaultWidgets = await renderHostWidgetNodes(
    node.defaultWidgets,
    context,
  );
  const additionalWidgets = await renderHostWidgetNodes(
    node.additionalWidgets,
    context,
  );

  return (
    <div
      data-module="host"
      data-model="layout"
      data-id={node.layout.id || ""}
      data-variant={node.layout.variant}
      className={cn("w-full flex flex-col", node.layout.className)}
    >
      {defaultWidgets}
      {children}
      {additionalWidgets}
    </div>
  );
};
