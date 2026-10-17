export type JsonValue =
  | null
  | string
  | number
  | boolean
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface IRecord {
  id: string;
  file: string;
  containerClassName: string | null;
  className: string | null;
  createdAt: string;
  updatedAt: string;
  variant: string;
  adminTitle: string;
  width: number | null;
  height: number | null;
  alt: string | null;
  size: number | null;
  extension: string | null;
  mimeType: string | null;
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
