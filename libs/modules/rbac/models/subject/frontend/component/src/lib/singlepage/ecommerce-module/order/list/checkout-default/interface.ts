import type { IModel } from "@sps/rbac/models/subject/sdk/model";
import type { IResult as ISubjectSdkResult } from "@sps/rbac/models/subject/sdk/server";
import type { ICartDetails } from "@sps/ecommerce/models/order/sdk/model";
import type {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/subject-default/interface";

export type { IModel };

export const variant = "ecommerce-module-order-list-checkout-default" as const;

export interface IComponentProps extends IParentComponentProps<
  IModel,
  typeof variant
> {
  language: string;
}

export interface IComponentPropsExtended extends IParentComponentPropsExtended<
  IModel,
  typeof variant,
  IComponentProps
> {}

export interface IRowProps {
  subject: IModel;
  ecommerceModuleOrder: ISubjectSdkResult["IEcommerceModuleOrderListResult"][number];
  language: string;
}

export interface IQuantityProps {
  subjectId: string;
  orderId: string;
  maxLineQuantity: number;
  line: ICartDetails["lines"][number];
  language: string;
}

export interface ICurrencyProps extends Pick<
  IRowProps,
  "subject" | "ecommerceModuleOrder" | "language"
> {}

export interface IDeliveryProps {
  language: string;
  currencySlug?: string;
}

export interface ISelectionProps extends IRowProps {
  line: ICartDetails["lines"][number];
  details: ICartDetails;
}
