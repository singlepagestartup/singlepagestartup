export type JsonValue =
  | null
  | string
  | number
  | boolean
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface IRecord {
  title: string;
  slug: string;
  id: string;
  createdAt: string;
  updatedAt: string;
  variant: string;
  availableOnRegistration: boolean;
}
