import type { CrmFormRecord } from "../../../../crm/shared/demo-crm";

export const variant = "me-crm-module-form-default";

export interface SubjectMeCrmFormDefaultProps {
  variant?: "me-crm-module-form-default";
  subject: {
    id: string;
    name: string;
    email: string;
  };
  title: string;
  description: string;
  crmForm: CrmFormRecord;
  embedded?: boolean;
}

type IVariantInputs = NonNullable<Partial<SubjectMeCrmFormDefaultProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-crm-module-form-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
