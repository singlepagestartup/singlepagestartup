export type JsonValue =
  null | string | number | boolean | JsonValue[] | { [key: string]: JsonValue };

export interface IRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  variant: string;
  title: string | null;
  content: string | null;
  adminTitle: string;
  slug: string;
}

export const variant = "admin-v2-table";
export interface IComponentProps {
  variant?: typeof variant;
  empty?: boolean;
}
export interface IComponentPropsExtended extends IComponentProps {}
