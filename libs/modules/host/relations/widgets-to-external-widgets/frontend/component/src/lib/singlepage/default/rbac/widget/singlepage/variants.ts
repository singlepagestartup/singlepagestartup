import { Component as SubjectEcommerceOrderComponentProps } from "./subject/ecommerce/order/orders";
import { Component as SubjectEcommerceProductListDefaultComponentProps } from "./subject/ecommerce/product/list/default";
import { Component as SubjectIdentitySettingsDefaultComponentProps } from "./subject/identity/settings-default";
import { Component as SubjectListDefaultComponentProps } from "./subject/list/default";
import { Component as SubjectOverviewDefaultComponentProps } from "./subject/overview/default";
import { Component as SubjectOverviewEcommerceModuleProductListDefaultComponentProps } from "./subject/overview/ecommerce-module/product/list/default";
import { Component as SubjectOverviewSocialModuleProfileOverviewDefaultComponentProps } from "./subject/overview/social-module/profile/overview-default";

export const variants = {
  "subject-ecommerce-order": SubjectEcommerceOrderComponentProps,
  "subject-ecommerce-product-list-default":
    SubjectEcommerceProductListDefaultComponentProps,
  "subject-identity-settings-default":
    SubjectIdentitySettingsDefaultComponentProps,
  "subject-list-default": SubjectListDefaultComponentProps,
  "subject-overview-default": SubjectOverviewDefaultComponentProps,
  "subject-overview-ecommerce-module-product-list-default":
    SubjectOverviewEcommerceModuleProductListDefaultComponentProps,
  "subject-overview-social-module-profile-overview-default":
    SubjectOverviewSocialModuleProfileOverviewDefaultComponentProps,
};
