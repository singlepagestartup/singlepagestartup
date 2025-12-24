import { Component as MeAuthenticationDefaultComponentProps } from "./me/authentication";
import { Component as MeCrmModuleFormRequestCreateComponentProps } from "./me/crm-module-form-request-create";
import { Component as MeEcommerceModuleCartDefaultComponentProps } from "./me/ecommerce-module/cart/default";
import { Component as MeEcommerceModuleOrderListCheckoutDefaultComponentProps } from "./me/ecommerce-module/order/list/checkout-default";
import { Component as MeEcommerceModuleProductCartDefaultComponentProps } from "./me/ecommerce-module/product/cart-default";
import { Component as MeEcommerceModuleProductCheckoutDefaultComponentProps } from "./me/ecommerce-module/product/checkout-default";
import { Component as SocialModuleProfileButtonDefaultComponentProps } from "./social-module-profile-button-default";
import { Component as MeSocialModuleProfileChatListDefaultComponentProps } from "./me/social-module-profile-chat-list-default";
import { Component as MeSocialModuleProfileChatOverviewDefaultComponentProps } from "./me/social-module-profile-chat-overview-default";

export const variants = {
  "me-authentication-default": MeAuthenticationDefaultComponentProps,
  "me-crm-module-form-request-create":
    MeCrmModuleFormRequestCreateComponentProps,
  "me-ecommerce-module-cart-default":
    MeEcommerceModuleCartDefaultComponentProps,
  "me-ecommerce-module-order-list-checkout-default":
    MeEcommerceModuleOrderListCheckoutDefaultComponentProps,
  "me-ecommerce-module-product-cart-default":
    MeEcommerceModuleProductCartDefaultComponentProps,
  "me-ecommerce-module-product-checkout-default":
    MeEcommerceModuleProductCheckoutDefaultComponentProps,
  "social-module-profile-button-default":
    SocialModuleProfileButtonDefaultComponentProps,
  "me-social-module-profile-chat-list-default":
    MeSocialModuleProfileChatListDefaultComponentProps,
  "me-social-module-profile-chat-overview-default":
    MeSocialModuleProfileChatOverviewDefaultComponentProps,
};
