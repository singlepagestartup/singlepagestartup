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
  title: string;
  content: string;
  description: string | null;
  contentHash: string;
  indexedContentHash: string | null;
  lastIndexedAt: string | null;
}
