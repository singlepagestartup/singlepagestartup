import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel as ICrmModuleForm } from "@sps/crm/models/form/sdk/model";

export type IComponentProps = ISpsComponentBase & {
  language: string;
  form: ICrmModuleForm;
  variant: "crm-module-form-request-create";
};
