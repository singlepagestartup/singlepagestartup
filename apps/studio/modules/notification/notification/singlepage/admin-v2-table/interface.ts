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
  status: string;
  title: string | null;
  data: JsonValue | null;
  reciever: string;
  attachments: JsonValue[] | null;
  sendAfter: string;
  sourceSystemId: string | null;
}
