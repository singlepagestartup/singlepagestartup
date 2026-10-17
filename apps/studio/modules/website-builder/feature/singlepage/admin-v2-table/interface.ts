export type JsonValue =
  | null
  | string
  | number
  | boolean
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface IRecord {
  className: string | null;
  id: string;
  createdAt: string;
  updatedAt: string;
  variant: string;
  title: JsonValue | null;
  subtitle: JsonValue | null;
  description: JsonValue | null;
  adminTitle: string;
  slug: string;
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
