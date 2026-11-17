import { ISpsComponentBase } from "@sps/ui-adapter";
import type { ReactNode } from "react";

export const variant = "admin-v2-table" as const;

export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  url: string;
  storeOfferCreate?: (storeId: string) => ReactNode;
}
