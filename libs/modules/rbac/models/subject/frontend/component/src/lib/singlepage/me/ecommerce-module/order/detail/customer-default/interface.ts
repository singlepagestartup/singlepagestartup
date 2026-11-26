import type { ISpsComponentBase } from "@sps/ui-adapter";
import type { IResult } from "@sps/rbac/models/subject/sdk/server";
import type { ReactNode } from "react";
import type { ISubjectCustomerOrderDetails } from "@sps/rbac/models/subject/sdk/model";
export const variant =
  "me-ecommerce-module-order-detail-customer-default" as const;
// Account pages resolve authenticationMe in the browser after session initialization.
export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  isServer: false;
  language: string;
  ecommerceModuleOrderId: string;
  renderDiscussion: (
    discussion: NonNullable<ISubjectCustomerOrderDetails["discussion"]>,
  ) => ReactNode;
}
export interface IComponentPropsExtended extends IComponentProps {
  ecommerceModuleOrder?: IResult["IEcommerceModuleOrderListResult"][number];
}
