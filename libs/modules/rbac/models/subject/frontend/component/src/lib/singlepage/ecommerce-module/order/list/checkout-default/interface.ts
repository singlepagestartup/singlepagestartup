export { type IModel } from "@sps/rbac/models/subject/sdk/model";
import { IModel } from "@sps/rbac/models/subject/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";

export const variant = "ecommerce-module-order-list-checkout-default" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  language: string;
}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}

export interface IRowProps {
  subject: IModel;
  ecommerceModuleOrder: import("@sps/rbac/models/subject/sdk/server").IResult["IEcommerceModuleOrderListResult"][number];
  index: number;
  language: string;
  form: import("react-hook-form").UseFormReturn<any>;
}

export interface IQuantityProps {
  subjectId: string;
  orderId: string;
  line: import("@sps/ecommerce/models/order/sdk/model").ICartDetails["lines"][number];
  language: string;
}
