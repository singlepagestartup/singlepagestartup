import type { ISupportFormCopy } from "../../../../../../../../crm/form";

export const variant = "me-crm-module-form-support-ai-chat";

export interface ISubjectSupportProps {
  variant?: "me-crm-module-form-support-ai-chat";
  formCopy?: ISupportFormCopy;
  projectHref?: string;
}

type IVariantInputs = NonNullable<ISubjectSupportProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-crm-module-form-support-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
