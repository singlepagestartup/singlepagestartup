import type { IHostStudioProviderProps } from "./HostRecords/index";

export const variant = "composition";

export interface IHostPageCompositionProps
  extends Omit<IHostStudioProviderProps, "children"> {
  variant?: "composition";
}

type IVariantInputs = NonNullable<IHostPageCompositionProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "composition";
}

export interface IComponentPropsExtended extends IComponentProps {}
