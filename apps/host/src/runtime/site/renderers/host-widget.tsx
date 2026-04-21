import { cn } from "@sps/shared-frontend-client-utils";

import { HostWidgetRenderer } from "../types";
import { renderExternalWidgetNodes } from "./shared";

export const renderHostWidget: HostWidgetRenderer = async ({
  context,
  node,
}) => {
  const externalWidgets = await renderExternalWidgetNodes(
    node.externalWidgets,
    context,
  );

  return (
    <div
      data-module="host"
      data-model="widget"
      data-id={node.widget.id || ""}
      data-variant={node.widget.variant}
      className={cn("w-full flex flex-col", node.widget.className)}
    >
      {externalWidgets}
    </div>
  );
};
