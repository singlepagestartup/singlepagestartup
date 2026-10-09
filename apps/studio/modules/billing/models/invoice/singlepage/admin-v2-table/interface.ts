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
  status: string;
  paymentUrl: string;
  successUrl: string;
  cancelUrl: string;
  amount: number;
  providerId: string | null;
  provider: string | null;
}
