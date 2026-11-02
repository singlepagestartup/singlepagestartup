import type { ISpsComponentBase } from "@sps/ui-adapter";
import type { IModel } from "@sps/rbac/models/subject/sdk/model";
import type { IComponentProps as IAuthenticationProps } from "../../../../../../authentication/me-default/interface";
export const variant = "me-social-module-profile-chat-list-default" as const;
export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  language: string;
  socialModuleChatId?: string;
  socialModuleThreadId?: string;
  /** authenticationMe supplies the current Subject in the local reader. */
  apiProps?: IAuthenticationProps["apiProps"];
}
export interface IComponentPropsExtended extends IComponentProps {
  data: IModel;
}
