import type { CrmInputRecord } from "../../../shared/demo-crm";

export const variant = "textarea-default";

export interface CrmInputTextareaDefaultProps {
  variant?: "textarea-default";
  input: CrmInputRecord;
  disabled?: boolean;
  namePrefix?: string;
}

type IVariantInputs = NonNullable<Partial<CrmInputTextareaDefaultProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "textarea-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
