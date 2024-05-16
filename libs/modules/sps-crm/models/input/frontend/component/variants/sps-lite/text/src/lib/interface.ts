import { IModel } from "@sps/sps-crm-models-input-contracts";
import { IModel as IModelExtended } from "@sps/sps-crm-models-input-contracts-extended";

export const variant = "text" as const;

export interface IComponentBase {
  showSkeletons?: boolean;
  isServer: boolean;
}

export interface IComponentProps extends IComponentBase {
  variant: typeof variant;
  data: Partial<IModel>;
}

export interface IComponentPropsExtended extends IComponentProps {
  data: IModelExtended;
}
