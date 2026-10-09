export type JsonValue =
  | null
  | string
  | number
  | boolean
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface IRecord {
  password: string | null;
  salt: string | null;
  account: string | null;
  email: string | null;
  provider: string;
  id: string;
  createdAt: string;
  updatedAt: string;
  variant: string;
  code: string | null;
}
