export const variant =
  "me-ecommerce-module-order-list-customer-default" as const;
export interface IOrder {
  id: string;
  date: string;
  status: string;
  lines: { id: string; title: string; quantity: number }[];
}
export interface IComponentProps {
  variant?: typeof variant;
  orders: IOrder[];
  detailHrefs: Record<string, string>;
}
export interface IComponentPropsExtended extends IComponentProps {}
