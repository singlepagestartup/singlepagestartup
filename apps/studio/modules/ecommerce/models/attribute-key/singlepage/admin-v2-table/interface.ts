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
  type: string;
  field: string;
  adminTitle: string;
  slug: string;
  title: JsonValue | null;
  prefix: JsonValue | null;
  suffix: JsonValue | null;
}
