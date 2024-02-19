import { IModel } from "@sps/sps-crm-form-contracts";
import { IModel as IModelExtended } from "@sps/sps-crm-form-contracts-extended";

export const variant = "simple" as const;

export interface IComponentBase {
  showSkeletons?: boolean;
  isServer: boolean;
}

export interface IComponentProps extends IComponentBase {
  variant: typeof variant;
  data: IModel;
}

export interface IComponentPropsExtended extends IComponentBase {
  isServer: boolean;
  data: IModelExtended;
}