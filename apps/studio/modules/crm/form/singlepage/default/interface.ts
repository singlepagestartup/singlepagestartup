import type { CrmFormRecord } from "../../../shared/demo-crm";

export const variant = "default";

export interface CrmFormDefaultProps {
  variant?: "default";
  form: CrmFormRecord;
  disabled?: boolean;
  subjectName?: string;
  embedded?: boolean;
}

type IVariantInputs = NonNullable<Partial<CrmFormDefaultProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "default";
}

export interface IComponentPropsExtended extends IComponentProps {}
