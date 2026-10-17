import type { IComponentProps, ISubjectTokensProps } from "./interface";
export type { ISubjectTokensProps } from "./interface";
import { Component as EcommerceModuleOrder } from "../../../../../../../../../ecommerce/order";

export function Component({
  variant = "me-ecommerce-module-order-checkout-tokens-ai-chat",
}: IComponentProps = {}) {
  return (
    <div data-module="rbac" data-model="subject" data-variant={variant}>
      <EcommerceModuleOrder variant="checkout-tokens-ai-chat" />
    </div>
  );
}
