import type { ReactNode } from "react";
import type { IOrder } from "../../list/customer-default/interface";
export const variant =
  "me-ecommerce-module-order-detail-customer-default" as const;
export interface IComponentProps {
  variant?: typeof variant;
  order?: IOrder;
  listHref: string;
  discussion?: ReactNode;
  threadHref?: string;
}
export interface IComponentPropsExtended extends IComponentProps {}
