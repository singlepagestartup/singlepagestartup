export type JsonValue =
  | null
  | string
  | number
  | boolean
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface IRecord {
  variant: string | null;
  id: string;
  createdAt: string;
  updatedAt: string;
  title: JsonValue | null;
  subtitle: JsonValue | null;
  description: JsonValue | null;
  adminTitle: string;
  slug: string;
}
