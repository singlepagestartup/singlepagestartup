import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel } from "@sps/rbac/models/subject/sdk/model";

export type IComponentProps = ISpsComponentBase & {
  data: IModel;
  language: string;
  variant: "social-module-profile-button-default";
};
