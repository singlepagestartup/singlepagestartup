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
  adminTitle: string;
  slug: string;
  title: JsonValue | null;
  shortDescription: JsonValue | null;
  description: JsonValue | null;
}
