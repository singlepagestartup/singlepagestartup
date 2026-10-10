export type JsonValue =
  | null
  | string
  | number
  | boolean
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface IRecord {
  id: string;
  title: JsonValue | null;
  subtitle: JsonValue | null;
  description: JsonValue | null;
  createdAt: string;
  updatedAt: string;
  variant: string;
  adminTitle: string;
  slug: string;
}
