import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel } from "@sps/rbac/models/subject/sdk/model";

export const variant = "social-module-profile-button-default" as const;
export interface IComponentProps extends ISpsComponentBase {
  data: IModel;
  language: string;
  variant: typeof variant;
}
