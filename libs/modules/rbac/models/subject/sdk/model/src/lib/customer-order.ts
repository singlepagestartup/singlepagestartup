import type { TWorkFulfillmentState } from "@sps/ecommerce/models/order/sdk/model";
import type { IModel as IProduct } from "@sps/ecommerce/models/product/sdk/model";

export interface ICustomerOrderMoney {
  amount: number;
  symbol: string;
  precision: number;
}

export interface ICustomerOrderDelivery {
  kind?: "digital";
  method?: string;
  address?: string;
  region?: string;
  pickupPointId?: string;
  price?: ICustomerOrderMoney;
}

export interface ICustomerOrderCheckout {
  email?: string;
  paymentProvider?: string;
  paidAt?: string;
  delivery?: ICustomerOrderDelivery[];
  total?: ICustomerOrderMoney;
  receipts?: { id: string; path: string }[];
}

export interface ISubjectCustomerOrderDetails {
  lines: {
    id: string;
    productId: string;
    title: NonNullable<IProduct["title"]>;
    quantity: number;
    productSlug?: string;
    coverUrl?: string;
    price?: ICustomerOrderMoney;
  }[];
  checkout?: ICustomerOrderCheckout;
  workState?: TWorkFulfillmentState;
  discussion?: { chatId: string; threadId: string };
  deliveredResult?: {
    id: string;
    versionId: string;
    name: string;
    mimeType?: string;
    savedToKnowledge: boolean;
  };
}
