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
  title: JsonValue | null;
  subtitle: JsonValue | null;
  description: JsonValue | null;
  adminTitle: string;
  slug: string;
}
