import { HostPageRenderer } from "../types";
import { renderHostPage } from "../renderers/page";

export const hostPageRegistry: Record<string, HostPageRenderer> = {
  default: renderHostPage,
};
