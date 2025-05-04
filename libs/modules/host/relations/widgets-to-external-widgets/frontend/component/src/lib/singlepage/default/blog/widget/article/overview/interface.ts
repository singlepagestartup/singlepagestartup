import { IComponentProps as IComponentPropsDefault } from "./default/interface";
import { IComponentProps as IComponentPropsEcommerceProductListDefault } from "./ecommerce-module-product-list-card-default/interface";
import { IComponentProps as IComponentPropsWithPrivateContentDefault } from "./with-private-content-default/interface";

export type IComponentProps =
  | IComponentPropsDefault
  | IComponentPropsEcommerceProductListDefault
  | IComponentPropsWithPrivateContentDefault;
