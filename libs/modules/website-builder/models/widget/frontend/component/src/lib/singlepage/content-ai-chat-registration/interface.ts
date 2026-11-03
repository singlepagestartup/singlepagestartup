import type { IModel } from "@sps/website-builder/models/widget/sdk/model";
import type {
  IComponentProps as IParent,
  IComponentPropsExtended as IParentExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
import type { ReactNode } from "react";
export const variant = "content-ai-chat-registration" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  language?: string;
  children?: ReactNode;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}
