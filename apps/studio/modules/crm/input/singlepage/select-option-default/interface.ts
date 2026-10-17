import type { CrmInputRecord } from "../../../shared/demo-crm";

export const variant = "select-option-default";

export interface CrmInputSelectOptionDefaultProps {
  variant?: "select-option-default";
  input: CrmInputRecord;
  disabled?: boolean;
  namePrefix?: string;
}

type IVariantInputs = NonNullable<Partial<CrmInputSelectOptionDefaultProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "select-option-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
