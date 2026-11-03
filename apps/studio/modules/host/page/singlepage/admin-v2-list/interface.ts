import type { IHostStudioProviderProps } from "../composition/HostRecords/index";

export const variant = "admin-v2-list";

export interface IHostPageAdminV2ListProps
  extends Omit<IHostStudioProviderProps, "children"> {
  variant?: "admin-v2-list";
  embedded?: boolean;
}

type IVariantInputs = NonNullable<IHostPageAdminV2ListProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "admin-v2-list";
}

export interface IComponentPropsExtended extends IComponentProps {}
