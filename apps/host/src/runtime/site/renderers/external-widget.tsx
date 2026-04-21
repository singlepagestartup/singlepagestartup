import { cn } from "@sps/shared-frontend-client-utils";

import { ExternalWidgetRenderer } from "../types";
import { renderExternalWidgetNodes } from "./shared";

export const renderExternalWidgetLink: ExternalWidgetRenderer = async ({
  context,
  node,
}) => {
  const rendered = await renderExternalWidgetNodes([node], context);

  return (
    <div
      data-module="host"
      data-relation="widgets-to-external-widgets"
      data-id={node.relation.id || ""}
      data-variant={node.relation.variant}
      className={cn("w-full flex flex-col", node.relation.className)}
    >
      {rendered}
    </div>
  );
};
