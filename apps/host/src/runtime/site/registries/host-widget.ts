import { HostWidgetRenderer } from "../types";
import { renderHostWidget } from "../renderers/host-widget";

export const hostWidgetRegistry: Record<string, HostWidgetRenderer> = {
  default: renderHostWidget,
};
