export type JsonValue =
  | null
  | string
  | number
  | boolean
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface IRecord {
  id: string;
  className: string | null;
  createdAt: string;
  updatedAt: string;
  variant: string;
  adminTitle: string;
  slug: string;
  title: JsonValue | null;
  subtitle: JsonValue | null;
  description: JsonValue | null;
}
