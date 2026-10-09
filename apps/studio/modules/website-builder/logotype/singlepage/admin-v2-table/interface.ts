export type JsonValue =
  | null
  | string
  | number
  | boolean
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface IRecord {
  className: string | null;
  url: string | null;
  id: string;
  createdAt: string;
  updatedAt: string;
  variant: string;
  title: JsonValue | null;
  adminTitle: string;
  slug: string;
}
