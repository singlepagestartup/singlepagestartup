export const variant = "order-status-changed" as const;
import { IModel as IEcommerceOrder } from "@sps/ecommerce/models/order/sdk/model";

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
      };
    };
  };
}

export interface IComponentPropsExtended extends IComponentProps {}
