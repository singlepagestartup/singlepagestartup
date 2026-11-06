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
  title: JsonValue | null;
  subtitle: JsonValue | null;
  description: JsonValue | null;
}

export const variant = "admin-v2-table";

export interface IProps {
  variant?: "admin-v2-table";
  empty?: boolean;
}

type IVariantInputs = NonNullable<IProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "admin-v2-table";
}

export interface IComponentPropsExtended extends IComponentProps {}
