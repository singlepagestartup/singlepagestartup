export const variant =
  "me-ecommerce-module-order-list-customer-default" as const;
export interface IOrder {
  id: string;
  date: string;
  status: string;
  lines: {
    id: string;
    productId: string;
    title: string;
    quantity: number;
    slug?: string;
    coverUrl?: string;
    priceLabel?: string;
  }[];
  checkout?: {
    email?: string;
    paymentMethod?: string;
    paidAt?: string;
    subscriptionPeriod?: string;
    comment?: string;
    delivery?: string;
    total?: string;
    downloadReceipt?: () => void;
  };
}
export interface IComponentProps {
  variant?: typeof variant;
  orders: IOrder[];
  detailHrefs: Record<string, string>;
}
export interface IComponentPropsExtended extends IComponentProps {}
