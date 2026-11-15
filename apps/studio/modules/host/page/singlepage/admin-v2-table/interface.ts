export type JsonValue =
  null | string | number | boolean | JsonValue[] | { [key: string]: JsonValue };

export interface IRecord {
  metadata: JsonValue;
  id: string;
  title: string;
  url: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  variant: string;
  className: string | null;
  language: string;
  adminTitle: string;
}

export const variant = "admin-v2-table";
export interface IComponentProps {
  variant?: typeof variant;
  empty?: boolean;
}
export interface IComponentPropsExtended extends IComponentProps {}
