export type JsonValue =
  | null
  | string
  | number
  | boolean
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface IRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  variant: string;
  orderIndex: number;
  amount: string;
  className: string | null;
  orderId: string;
  billingModuleCurrencyId: string;
}
