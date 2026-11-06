export { type IModel } from "@sps/rbac/models/subject/sdk/model";
import type { ISpsComponentBase } from "@sps/ui-adapter";
import type { IModel } from "@sps/rbac/models/subject/sdk/model";
import type { IComponentProps as IAuthenticationProps } from "../../../authentication/me-default/interface";

export const variant = "me-ecommerce-module-cart-default" as const;

export interface IComponentBaseProps extends ISpsComponentBase {
  language: string;
  variant: typeof variant;
}

export interface IApiComponentProps extends IComponentBaseProps {
  dataSource?: "api";
  /** authenticationMe supplies the current Subject in client.tsx/server.tsx. */
  apiProps?: IAuthenticationProps["apiProps"];
}

export interface ILoadedComponentProps extends IComponentBaseProps {
  dataSource: "props";
  data: IModel;
}

export type IComponentProps = IApiComponentProps | ILoadedComponentProps;

export interface IComponentPropsExtended extends IComponentBaseProps {
  data: IModel;
}
