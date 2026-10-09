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
  className: string | null;
  variant: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  sourceSystemId: string | null;
  interaction: JsonValue | null;
  metadata: JsonValue | null;
}
