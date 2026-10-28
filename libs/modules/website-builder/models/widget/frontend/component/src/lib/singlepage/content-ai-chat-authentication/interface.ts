import type { ReactNode } from "react";
import type { IModel } from "@sps/website-builder/models/widget/sdk/model";
import type {
  IComponentProps as IParent,
  IComponentPropsExtended as IParentExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
export const variant = "content-ai-chat-authentication" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  language?: string;
  children?: ReactNode;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}
export interface IAuthenticationPresentationProps {
  data: IModel;
  isServer: boolean;
  language?: string;
  className?: string;
  children?: ReactNode;
  variant:
    | typeof variant
    | "content-ai-chat-registration"
    | "content-ai-chat-forgot-password"
    | "content-ai-chat-reset-password";
}
