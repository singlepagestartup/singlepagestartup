import type { IHostStudioProviderProps } from "../composition/HostRecords/index";

export const variant = "default";

export interface IHostPageDefaultProps
  extends Omit<IHostStudioProviderProps, "children"> {
  variant?: "default";
  id?: string;
}

type IVariantInputs = NonNullable<IHostPageDefaultProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "default";
}

export interface IComponentPropsExtended extends IComponentProps {}
