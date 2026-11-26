import type { ISpsComponentBase } from "@sps/ui-adapter";
import type { IStoreOrderRow } from "@sps/ecommerce/models/order/sdk/model";

export const variant = "store-list-row" as const;
export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  dataSource: "props";
  data: IStoreOrderRow;
  href: string;
  language: string;
  showItems?: boolean;
  quantity?: number;
}

export interface IComponentPropsExtended extends IComponentProps {}
