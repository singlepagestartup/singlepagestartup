import { IComponentProps as IDefaultComponentProps } from "./default/interface";
import { IComponentProps as ISocialModuleComponentProps } from "./social-module/interface";
import { IComponentProps as IEcommerceModuleComponentProps } from "./ecommerce-module/interface";

export type IComponentProps =
  | IDefaultComponentProps
  | ISocialModuleComponentProps
  | IEcommerceModuleComponentProps;
