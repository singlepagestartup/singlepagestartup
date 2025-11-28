export { type IModel } from "@sps/ecommerce/models/product/sdk/model";
import { IModel } from "@sps/ecommerce/models/product/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
import { IModel as IBillingModuleCurrency } from "@sps/billing/models/currency/sdk/model";

export const variant = "price-default" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  billingModuleCurrencyId?: IBillingModuleCurrency["id"];
  language: string;
}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}
