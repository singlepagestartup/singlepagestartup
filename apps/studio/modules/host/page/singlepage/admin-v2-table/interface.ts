export type JsonValue =
  | null
  | string
  | number
  | boolean
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface IRecord {
  id: string;
  title: string;
  url: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  variant: string;
  className: string | null;
  language: string;
  adminTitle: string;
}
