import type { ComponentProps, ComponentPropsWithoutRef } from "react";
import type { FormField } from "@sps/ui-adapter";
export { type IModel } from "@sps/rbac/models/subject/sdk/model";
import type {
  IModel,
  ISubjectCartDetails,
} from "@sps/rbac/models/subject/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
import { IModel as IEcommerceModuleOrder } from "@sps/ecommerce/models/order/sdk/model";
import { IModel as IEcommerceModuleProduct } from "@sps/ecommerce/models/product/sdk/model";
import { IModel as IEcommerceModuleStore } from "@sps/ecommerce/models/store/sdk/model";

export const variant = "ecommerce-module-order-checkout-default" as const;

export interface IComponentProps extends IParentComponentProps<
  IModel,
  typeof variant
> {
  language: string;
  ecommerceModuleProduct: IEcommerceModuleProduct;
  ecommerceModuleOrder: IEcommerceModuleOrder & {
    cartDetails?: ISubjectCartDetails;
  };
  disabled?: boolean;
  ecommerceModuleStore?: IEcommerceModuleStore;
}

export interface IComponentPropsExtended extends IParentComponentPropsExtended<
  IModel,
  typeof variant,
  IComponentProps
> {}

export interface IReceiptEmailProps {
  subject: { id: string; authenticated?: boolean };
  form: ComponentProps<typeof FormField>["form"];
  label?: string;
  placeholder: string;
  inputClassName?: string;
}

export interface IOrderCommentProps {
  language: string;
  form: ComponentProps<typeof FormField>["form"];
}

export interface ICheckoutFormProps extends Omit<
  ComponentPropsWithoutRef<"form">,
  "form" | "onSubmitCapture"
> {
  form: Pick<
    ComponentProps<typeof FormField>["form"],
    "getValues" | "setValue"
  >;
}
