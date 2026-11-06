import type { ISpsComponentBase } from "@sps/ui-adapter";
import type { IModel } from "@sps/rbac/models/subject/sdk/model";
import type { IComponentProps as IAuthenticationProps } from "../../../../../authentication/me-default/interface";

export const variant =
  "me-ecommerce-module-order-list-checkout-default" as const;
export interface IComponentProps extends ISpsComponentBase {
  language: string;
  /** authenticationMe supplies the current Subject in client.tsx/server.tsx. */
  apiProps?: IAuthenticationProps["apiProps"];
  variant: typeof variant;
}

export interface IComponentPropsExtended extends IComponentProps {
  data: IModel;
}
