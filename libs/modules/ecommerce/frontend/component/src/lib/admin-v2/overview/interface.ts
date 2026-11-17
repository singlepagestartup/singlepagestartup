import { ISpsComponentBase } from "@sps/ui-adapter";
import type { ReactNode } from "react";

export interface IComponentProps extends ISpsComponentBase {
  url: string;
  offerCreate?: ReactNode;
  storeOfferCreate?: (storeId: string) => ReactNode;
}

export interface IComponentPropsExtended extends IComponentProps {}
