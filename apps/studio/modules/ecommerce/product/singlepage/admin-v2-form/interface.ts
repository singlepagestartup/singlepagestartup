import type { ReactNode } from "react";

import type { IStudioProduct } from "../../shared";

export const variant = "admin-v2-form";

export interface IProductAdminFormProps {
  variant?: "admin-v2-form";
  product?: IStudioProduct;
  onSave?: (product: IStudioProduct) => void;
  attributes?: ReactNode;
  embedded?: boolean;
}

type IVariantInputs = NonNullable<IProductAdminFormProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "admin-v2-form";
}

export interface IComponentPropsExtended extends IComponentProps {}
