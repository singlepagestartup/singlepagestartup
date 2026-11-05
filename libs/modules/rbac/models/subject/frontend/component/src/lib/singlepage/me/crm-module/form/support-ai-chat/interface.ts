import type {
  IComponentPropsExtended as IParentExtended,
  IComponentProps as IParent,
} from "@sps/shared-frontend-components/singlepage/subject-default/interface";
import type { IModel } from "@sps/rbac/models/subject/sdk/model";

export const variant = "me-crm-module-form-support-ai-chat" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  crmModuleFormId: string;
  language?: string;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}

export interface ISupportFormProps extends IComponentPropsExtended {
  crmModuleForm: import("@sps/crm/models/form/sdk/model").IModel;
}
