import { IComponentProps as IAuthenticationDefaultComponentProps } from "./me/authentication/interface";
import { IComponentProps as ICrmModuleFormRequestCreateDefaultComponentProps } from "./me/crm-module-form-request-create/interface";
import { IComponentProps as IEcommerceModuleCartDefaultComponentProps } from "./me/ecommerce-module/cart/default/interface";
import { IComponentProps as IEcommerceModuleOrderListCheckoutDefaultComponentProps } from "./me/ecommerce-module/order/list/checkout-default/interface";
import { IComponentProps as IEcommerceModuleProductCartDefaultComponentProps } from "./me/ecommerce-module/product/cart-default/interface";
import { IComponentProps as IEcommerceModuleProductCheckoutDefaultComponentProps } from "./me/ecommerce-module/product/checkout-default/interface";
import { IComponentProps as ISocialModuleProfileButtonDefaultComponentProps } from "./social-module-profile-button-default/interface";
import { IComponentProps as IMeSocialModuleProfileChatListDefaultComponentProps } from "./me/social-module-profile-chat-list-default/interface";
import { IComponentProps as IMeSocialModuleProfileChatOverviewDefaultComponentProps } from "./me/social-module-profile-chat-overview-default/interface";

export type IComponentProps =
  | IAuthenticationDefaultComponentProps
  | ICrmModuleFormRequestCreateDefaultComponentProps
  | IEcommerceModuleCartDefaultComponentProps
  | IEcommerceModuleOrderListCheckoutDefaultComponentProps
  | IEcommerceModuleProductCartDefaultComponentProps
  | IEcommerceModuleProductCheckoutDefaultComponentProps
  | ISocialModuleProfileButtonDefaultComponentProps
  | IMeSocialModuleProfileChatListDefaultComponentProps
  | IMeSocialModuleProfileChatOverviewDefaultComponentProps;
