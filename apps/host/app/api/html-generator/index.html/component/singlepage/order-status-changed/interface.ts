export const variant = "order-status-changed" as const;
import { IModel as IEcommerceProduct } from "@sps/ecommerce/models/product/sdk/model";
import { IModel as IEcommerceOrder } from "@sps/ecommerce/models/order/sdk/model";
import { IModel as IEcommerceOrdersToProducts } from "@sps/ecommerce/relations/orders-to-products/sdk/model";

export interface IComponentProps {
  variant: typeof variant;
  data: {
    ecommerce: {
      order: IEcommerceOrder & {
        checkoutAttributes: {
          amount: number;
          type: "subscription" | "one-time";
          interval: "day" | "week" | "month" | "year";
        };
        ordersToProducts: (IEcommerceOrdersToProducts & {
          product: IEcommerceProduct;
        })[];
      };
    };
  };
}

export interface IComponentPropsExtended extends IComponentProps {}
