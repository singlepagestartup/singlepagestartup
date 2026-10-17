import type { IStudioProduct } from "../../shared";

export const variant = "admin-v2-select-input";

export interface IProductSelectProps {
  variant?: "admin-v2-select-input";
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  records?: IStudioProduct[];
}

type IVariantInputs = NonNullable<IProductSelectProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "admin-v2-select-input";
}

export interface IComponentPropsExtended extends IComponentProps {}
