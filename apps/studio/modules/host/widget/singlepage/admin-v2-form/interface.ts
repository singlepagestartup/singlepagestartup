import type { IHostStudioProviderProps } from "../../../page/singlepage/composition/HostRecords/index";

import type { IModel } from "../../interface";

export const variant = "admin-v2-form";

export interface IHostWidgetAdminV2FormProps
  extends Omit<IHostStudioProviderProps, "children"> {
  variant?: "admin-v2-form";
  record?: IModel;
  onSave?: (record: IModel) => void;
  embedded?: boolean;
}

type IVariantInputs = NonNullable<IHostWidgetAdminV2FormProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "admin-v2-form";
}

export interface IComponentPropsExtended extends IComponentProps {}
