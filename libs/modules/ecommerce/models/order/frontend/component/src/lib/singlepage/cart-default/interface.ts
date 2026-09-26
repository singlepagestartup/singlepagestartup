export { type IModel } from "@sps/ecommerce/models/order/sdk/model";
import { IModel } from "@sps/ecommerce/models/order/sdk/model";
import { IModel as IOrdersToProducts } from "@sps/ecommerce/relations/orders-to-products/sdk/model";
import { type IResult as IOrdersToProductsResult } from "@sps/ecommerce/relations/orders-to-products/sdk/server";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";

export const variant = "cart-default" as const;

export interface IComponentProps
  extends Omit<IParentComponentProps<IModel, typeof variant>, "apiProps"> {
  language: string;
  billingModuleCurrencyId?: string;
  ordersToProducts: (IOrdersToProducts & {
    total: IOrdersToProductsResult["ITotalResult"];
  })[];
}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}
