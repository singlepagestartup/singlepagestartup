import type { CrmFormRecord } from "../../../shared/demo-crm";

export const variant = "form-list-default";

export interface CrmWidgetFormListDefaultProps {
  variant?: "form-list-default";
  eyebrow: string;
  title: string;
  description: string;
  form: CrmFormRecord;
  subjectName?: string;
  embedded?: boolean;
}

type IVariantInputs = NonNullable<Partial<CrmWidgetFormListDefaultProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "form-list-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
