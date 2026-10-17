import type { IHostStudioProviderProps } from "../../../page/singlepage/composition/HostRecords/index";

export const variant = "admin-v2-list";

export interface IHostWidgetAdminV2ListProps
  extends Omit<IHostStudioProviderProps, "children"> {
  variant?: "admin-v2-list";
  embedded?: boolean;
}

type IVariantInputs = NonNullable<IHostWidgetAdminV2ListProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "admin-v2-list";
}

export interface IComponentPropsExtended extends IComponentProps {}
