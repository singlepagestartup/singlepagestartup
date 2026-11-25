export { type IModel } from "@sps/rbac/models/subject/sdk/model";
import type { IRowProps } from "../../../../ecommerce-module/order/list/checkout-default/interface";
import type { ISpsComponentBase } from "@sps/ui-adapter";
import type { IModel } from "@sps/rbac/models/subject/sdk/model";
import type { IComponentProps as IAuthenticationProps } from "../../../../authentication/me-default/interface";
import type { IModel as IEcommerceModuleProduct } from "@sps/ecommerce/models/product/sdk/model";
import type { IModel as IEcommerceModuleStore } from "@sps/ecommerce/models/store/sdk/model";

export const variant = "me-ecommerce-module-product-cart-default" as const;

export interface IComponentBaseProps extends ISpsComponentBase {
  ecommerceModuleProduct: IEcommerceModuleProduct;
  ecommerceModuleStore?: IEcommerceModuleStore;
  withOneStepCheckout?: boolean;
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

export interface ISavedOrderProps extends Pick<
  IRowProps,
  "subject" | "ecommerceModuleOrder" | "language"
> {
  ecommerceModuleProduct: IEcommerceModuleProduct;
  canOpenDiscussion: () => boolean;
}
