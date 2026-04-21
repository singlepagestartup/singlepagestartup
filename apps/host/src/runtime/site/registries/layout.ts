import { HostLayoutRenderer } from "../types";
import { renderHostLayout } from "../renderers/layout";

export const hostLayoutRegistry: Record<string, HostLayoutRenderer> = {
  default: renderHostLayout,
};
