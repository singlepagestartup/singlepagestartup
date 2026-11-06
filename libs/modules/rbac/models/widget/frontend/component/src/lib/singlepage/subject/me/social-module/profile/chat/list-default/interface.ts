import type { IModel } from "@sps/rbac/models/widget/sdk/model";
import type {
  IComponentProps as IParent,
  IComponentPropsExtended as IParentExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
export const variant =
  "subject-me-social-module-profile-chat-list-default" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  language?: string;
  socialModuleChatId?: string;
  socialModuleThreadId?: string;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}
export interface IContentProps {
  language: string;
  socialModuleChatId?: string;
  socialModuleThreadId?: string;
}
