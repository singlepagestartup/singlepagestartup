import type { CrmStepRecord } from "../../../shared/demo-crm";

export const variant = "default";

export interface CrmStepDefaultProps {
  variant?: "default";
  step: CrmStepRecord;
  disabled?: boolean;
  namePrefix?: string;
}

type IVariantInputs = NonNullable<Partial<CrmStepDefaultProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "default";
}

export interface IComponentPropsExtended extends IComponentProps {}
