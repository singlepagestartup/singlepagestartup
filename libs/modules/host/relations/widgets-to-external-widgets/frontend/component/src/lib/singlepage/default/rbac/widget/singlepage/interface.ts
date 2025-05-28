import { IComponentProps as ISubjectEcommerceOrderComponentProps } from "./subject/ecommerce/order/orders/interface";
import { IComponentProps as ISubjectEcommerceProductListCardDefaultComponentProps } from "./subject/ecommerce/product/list/card-default/interface";
import { IComponentProps as ISubjectIdentitySettingsDefaultComponentProps } from "./subject/identity/settings-default/interface";
import { IComponentProps as ISubjectListDefaultComponentProps } from "./subject/list/default/interface";
import { IComponentProps as ISubjectOverviewDefaultComponentProps } from "./subject/overview/default/interface";
import { IComponentProps as ISubjectOverviewEcommerceModuleProductListCardDefaultComponentProps } from "./subject/overview/ecommerce-module/product/list/card-default/interface";
import { IComponentProps as ISubjectOverviewSocialModuleProfileOverviewDefaultComponentProps } from "./subject/overview/social-module/profile/overview-default/interface";

export type IComponentProps =
  | ISubjectEcommerceOrderComponentProps
  | ISubjectEcommerceProductListCardDefaultComponentProps
  | ISubjectIdentitySettingsDefaultComponentProps
  | ISubjectListDefaultComponentProps
  | ISubjectOverviewDefaultComponentProps
  | ISubjectOverviewEcommerceModuleProductListCardDefaultComponentProps
  | ISubjectOverviewSocialModuleProfileOverviewDefaultComponentProps;
