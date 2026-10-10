export type JsonValue =
  | null
  | string
  | number
  | boolean
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface IRecord {
  title: string;
  adminTitle: string;
  id: string;
  createdAt: string;
  updatedAt: string;
  variant: string;
  slug: string;
  interval: string | null;
}
