import type { IHostStudioProviderProps } from "../../../page/singlepage/composition/HostRecords/index";

export const variant = "admin-v2-select-input";

export interface IHostLayoutAdminV2SelectInputProps
  extends Omit<IHostStudioProviderProps, "children"> {
  variant?: "admin-v2-select-input";
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

type IVariantInputs = NonNullable<IHostLayoutAdminV2SelectInputProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "admin-v2-select-input";
}

export interface IComponentPropsExtended extends IComponentProps {}
