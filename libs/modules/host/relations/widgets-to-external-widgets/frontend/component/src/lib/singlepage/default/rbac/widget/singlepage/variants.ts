import { Component as SubjectEcommerceOrderComponentProps } from "./subject/ecommerce/order/orders/Component";
import { Component as SubjectEcommerceProductListDefaultComponentProps } from "./subject/ecommerce/product/list/default/Component";
import { Component as SubjectIdentitySettingsDefaultComponentProps } from "./subject/identity/settings-default/Component";
import { Component as SubjectListDefaultComponentProps } from "./subject/list/default/Component";
import { Component as SubjectOverviewDefaultComponentProps } from "./subject/overview/default/Component";
import { Component as SubjectOverviewEcommerceModuleProductListDefaultComponentProps } from "./subject/overview/ecommerce-module/product/list/default/Component";
import { Component as SubjectOverviewSocialModuleProfileOverviewDefaultComponentProps } from "./subject/overview/social-module/profile/overview-default/Component";

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
