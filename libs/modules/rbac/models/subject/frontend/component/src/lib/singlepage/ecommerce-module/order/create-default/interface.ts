export { type IModel } from "@sps/rbac/models/subject/sdk/model";
import { IModel } from "@sps/rbac/models/subject/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
import { IModel as IEcommerceModuleProduct } from "@sps/ecommerce/models/product/sdk/model";
import { IModel as IEcommerceModuleStore } from "@sps/ecommerce/models/store/sdk/model";
import { IModel as IBillingModuleCurrency } from "@sps/billing/models/currency/sdk/model";

export const variant = "ecommerce-module-order-create-default" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  language: string;
  product: IEcommerceModuleProduct;
  store?: IEcommerceModuleStore;
  billingModule?: {
    currency?: IBillingModuleCurrency;
  };
}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}
