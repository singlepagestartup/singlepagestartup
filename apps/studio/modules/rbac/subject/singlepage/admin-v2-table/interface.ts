export type JsonValue =
  null | string | number | boolean | JsonValue[] | { [key: string]: JsonValue };

export interface IRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  variant: string;
  slug: string;
  tokensValidAfter: string | null;
}

export const variant = "admin-v2-table";
export interface IComponentProps {
  variant?: typeof variant;
  empty?: boolean;
}
export interface IComponentPropsExtended extends IComponentProps {}
