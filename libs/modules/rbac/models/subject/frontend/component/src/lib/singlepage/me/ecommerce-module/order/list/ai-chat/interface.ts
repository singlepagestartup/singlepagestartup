import type {
  IComponentPropsExtended as IParentExtended,
  IComponentProps as IParent,
} from "@sps/shared-frontend-components/singlepage/subject-default/interface";
import type { IModel } from "@sps/rbac/models/subject/sdk/model";
import type { IResult } from "@sps/rbac/models/subject/sdk/server";

export const variant = "me-ecommerce-module-order-list-ai-chat" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  language?: string;
}

export interface IComponentPropsExtended extends IParentExtended<
  IModel,
  typeof variant,
  IComponentProps
> {}

export interface IRepeatConfirmation {
  orderId: string;
}

export interface IOrderRowProps {
  order: IResult["IEcommerceModuleOrderListResult"][number];
  language: string;
  confirming: boolean;
  repeating: boolean;
  disabled: boolean;
  error: string;
  onRepeat: (order: IOrderRowProps["order"]) => void;
  onConfirm: () => void;
  onCancel: () => void;
}
