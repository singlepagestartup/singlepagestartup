import type { IComponentProps as IEcommerceModuleWidgetProps } from "../../../../ecommerce/widget";

export const variant = "subject-me-ecommerce-module-token-find" as const;

export interface IComponentProps
  extends Omit<
    Extract<IEcommerceModuleWidgetProps, { variant: "token-find" }>,
    "variant"
  > {
  variant?: typeof variant;
}

export interface IComponentPropsExtended extends IComponentProps {}
