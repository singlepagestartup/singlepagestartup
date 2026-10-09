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
  anchor: string | null;
  className: string | null;
  id: string;
  createdAt: string;
  updatedAt: string;
  variant: string;
  adminTitle: string;
  slug: string;
}
