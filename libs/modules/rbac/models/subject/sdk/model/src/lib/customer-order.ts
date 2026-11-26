import type { TWorkFulfillmentState } from "@sps/ecommerce/models/order/sdk/model";
import type { IModel as IProduct } from "@sps/ecommerce/models/product/sdk/model";

export interface ISubjectCustomerOrderDetails {
  lines: {
    id: string;
    productId: string;
    title: NonNullable<IProduct["title"]>;
    quantity: number;
  }[];
  workState?: TWorkFulfillmentState;
  discussion?: { chatId: string; threadId: string };
}
