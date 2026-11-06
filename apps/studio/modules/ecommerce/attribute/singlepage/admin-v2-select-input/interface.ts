import type { IStudioAttribute } from "../../shared";

export const variant = "admin-v2-select-input";

export interface IAttributeSelectProps {
  variant?: "admin-v2-select-input";
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  records?: IStudioAttribute[];
}

type IVariantInputs = NonNullable<IAttributeSelectProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "admin-v2-select-input";
}

export interface IComponentPropsExtended extends IComponentProps {}
