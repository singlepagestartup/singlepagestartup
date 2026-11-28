import type { ReactNode } from "react";
import type { IOrder } from "../../list/customer-default/interface";
export const variant =
  "me-ecommerce-module-order-detail-customer-default" as const;
export interface IComponentProps {
  variant?: typeof variant;
  order?: IOrder;
  discussion?: ReactNode;
  result?: { name: string; savedToKnowledge: boolean; onChange: () => void };
}
export interface IComponentPropsExtended extends IComponentProps {}
