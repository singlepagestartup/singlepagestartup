export type JsonValue =
  | null
  | string
  | number
  | boolean
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface IRecord {
  className: string | null;
  title: JsonValue | null;
  subtitle: JsonValue | null;
  description: JsonValue | null;
  id: string;
  createdAt: string;
  updatedAt: string;
  variant: string;
  adminTitle: string;
  slug: string;
}
