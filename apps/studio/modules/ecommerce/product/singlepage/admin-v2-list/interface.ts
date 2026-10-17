import type { IStudioProduct } from "../../shared";

export const variant = "admin-v2-list";

export interface IProductAdminListProps {
  variant?: "admin-v2-list";
  initialProduct?: IStudioProduct;
}

type IVariantInputs = NonNullable<IProductAdminListProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "admin-v2-list";
}

export interface IComponentPropsExtended extends IComponentProps {}
