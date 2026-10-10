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
  number: number | null;
  boolean: boolean | null;
  date: string | null;
  datetime: string | null;
  string: JsonValue | null;
  adminTitle: string;
  slug: string;
}
