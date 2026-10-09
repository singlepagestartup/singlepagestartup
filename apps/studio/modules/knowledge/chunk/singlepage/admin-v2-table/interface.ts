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
  adminTitle: string;
  slug: string;
  text: string;
  embedding: number[];
  chunkIndex: number;
  tokenEstimate: number;
  contentHash: string;
  metadata: JsonValue;
}
