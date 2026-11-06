import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel as ICrmModuleForm } from "@sps/crm/models/form/sdk/model";

export const variant = "me-crm-module-form-request-create" as const;
export interface IComponentProps extends ISpsComponentBase {
  language: string;
  crmModuleForm: ICrmModuleForm;
  variant: typeof variant;
}
