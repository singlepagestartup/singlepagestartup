import { Component as MeAuthenticationDefaultComponentProps } from "./me/authentication/Component";
import { Component as MeCrmModuleFormRequestCreateDefaultComponentProps } from "./me/crm-module-form-request-create/Component";
import { Component as MeEcommerceModuleCartDefaultComponentProps } from "./me/ecommerce-module/cart/default/Component";
import { Component as MeEcommerceModuleOrderListCheckoutDefaultComponentProps } from "./me/ecommerce-module/order/list/checkout-default/Component";
import { Component as MeEcommerceModuleProductCartDefaultComponentProps } from "./me/ecommerce-module/product/cart-default/Component";
import { Component as MeEcommerceModuleProductCheckoutDefaultComponentProps } from "./me/ecommerce-module/product/checkout-default/Component";
import { Component as SocialModuleProfileButtonDefaultComponentProps } from "./social-module-profile-button-default/Component";

export const variants = {
  "me-authentication-default": MeAuthenticationDefaultComponentProps,
  "me-crm-module-form-request-create-default":
    MeCrmModuleFormRequestCreateDefaultComponentProps,
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
};
