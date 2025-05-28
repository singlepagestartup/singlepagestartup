import { Component as SubjectEcommerceOrderComponentProps } from "./subject/ecommerce/order/orders/Component";
import { Component as SubjectEcommerceProductListCardDefaultComponentProps } from "./subject/ecommerce/product/list/card-default/Component";
import { Component as SubjectIdentitySettingsDefaultComponentProps } from "./subject/identity/settings-default/Component";
import { Component as SubjectListDefaultComponentProps } from "./subject/list/default/Component";
import { Component as SubjectOverviewDefaultComponentProps } from "./subject/overview/default/Component";
import { Component as SubjectOverviewEcommerceModuleProductListCardDefaultComponentProps } from "./subject/overview/ecommerce-module/product/list/card-default/Component";
import { Component as SubjectOverviewSocialModuleProfileOverviewDefaultComponentProps } from "./subject/overview/social-module/profile/overview-default/Component";

export const variants = {
  "subject-ecommerce-order": SubjectEcommerceOrderComponentProps,
  "subject-ecommerce-product-list-card-default":
    SubjectEcommerceProductListCardDefaultComponentProps,
  "subject-identity-settings-default":
    SubjectIdentitySettingsDefaultComponentProps,
  "subject-list-default": SubjectListDefaultComponentProps,
  "subject-overview-default": SubjectOverviewDefaultComponentProps,
  "subject-overview-ecommerce-module-product-list-card-default":
    SubjectOverviewEcommerceModuleProductListCardDefaultComponentProps,
  "subject-overview-social-module-profile-overview-default":
    SubjectOverviewSocialModuleProfileOverviewDefaultComponentProps,
};
