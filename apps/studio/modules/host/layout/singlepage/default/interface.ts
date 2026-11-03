import type { IHostStudioProviderProps } from "../../../page/singlepage/composition/HostRecords/index";

export const variant = "default";

export interface IHostLayoutDefaultProps
  extends Omit<IHostStudioProviderProps, "children"> {
  variant?: "default";
  id?: string;
}

type IVariantInputs = NonNullable<IHostLayoutDefaultProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "default";
}

export interface IComponentPropsExtended extends IComponentProps {}
