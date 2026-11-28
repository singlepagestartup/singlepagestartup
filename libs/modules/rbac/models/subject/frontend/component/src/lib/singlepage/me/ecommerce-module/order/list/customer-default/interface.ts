import type { ISpsComponentBase } from "@sps/ui-adapter";
import type { IResult } from "@sps/rbac/models/subject/sdk/server";
import type { ReactNode } from "react";

export const variant =
  "me-ecommerce-module-order-list-customer-default" as const;
// Account pages resolve authenticationMe in the browser after session initialization.
export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  isServer: false;
  language: string;
}
export interface IComponentPropsExtended extends IComponentProps {
  ecommerceModuleOrders: IResult["IEcommerceModuleOrderListResult"];
  pagination?: ReactNode;
}
