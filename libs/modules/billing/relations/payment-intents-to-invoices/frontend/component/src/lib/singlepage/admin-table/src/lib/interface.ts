export { type IModel } from "@sps/billing/relations/payment-intents-to-invoices/sdk/model";
import { IModel } from "@sps/billing/relations/payment-intents-to-invoices/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/admin-table2/interface";

export const variant = "admin-table" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}
