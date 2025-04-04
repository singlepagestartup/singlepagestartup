import { IModel as IEcommerceProduct } from "@sps/ecommerce/models/product/sdk/model";
import { IModel as IEcommerceOrder } from "@sps/ecommerce/models/order/sdk/model";
import { IModel as IEcommerceOrdersToProducts } from "@sps/ecommerce/relations/orders-to-products/sdk/model";
import { IModel as IEcommerceOrdersToBillingModuleCurrencies } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/sdk/model";
import { IModel as IBillingCurrency } from "@sps/billing/models/currency/sdk/model";
import { IModel as IFileStorageFile } from "@sps/file-storage/models/file/sdk/model";

export const variant =
  "generate-template-ecommerce-order-receipt-default" as const;

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
        ordersToBillingModuleCurrencies: IEcommerceOrdersToBillingModuleCurrencies &
          {
            billingModuleCurrency: IBillingCurrency;
          }[];
      };
    };
    fileStorage: {
      file: IFileStorageFile;
    };
  };
}

export interface IComponentPropsExtended extends IComponentProps {}
