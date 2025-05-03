import { Component as EcommerceProductAction } from "./ecommerce-product-action/Component";
import { IComponentProps as IEcommerceProductActionProps } from "./ecommerce-product-action/interface";
import { IComponentProps as ISocialModuleProfileButtonDefaultProps } from "./social-module-profile-button-default/interface";
import { Component as SocialModuleProfileButtonDefault } from "./social-module-profile-button-default/Component";
export function Component(
  props: IEcommerceProductActionProps | ISocialModuleProfileButtonDefaultProps,
) {
  if (props.variant === "ecommerce-product-action") {
    return (
      <EcommerceProductAction
        isServer={props.isServer}
        language={props.language}
        billingModuleCurrencyId={props.billingModuleCurrencyId}
        product={props.product}
        store={props.store}
        variant={props.variant}
      />
    );
  }

  if (props.variant === "social-module-profile-button-default") {
    return (
      <SocialModuleProfileButtonDefault
        isServer={props.isServer}
        language={props.language}
        data={props.data}
        variant={props.variant}
      />
    );
  }
  return <></>;
}
