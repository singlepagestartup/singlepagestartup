export type JsonValue =
  | null
  | string
  | number
  | boolean
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface IRecord {
  title: JsonValue | null;
  subtitle: JsonValue | null;
  description: JsonValue | null;
  id: string;
  createdAt: string;
  updatedAt: string;
  variant: string;
  className: string | null;
  adminTitle: string;
  slug: string;
}
