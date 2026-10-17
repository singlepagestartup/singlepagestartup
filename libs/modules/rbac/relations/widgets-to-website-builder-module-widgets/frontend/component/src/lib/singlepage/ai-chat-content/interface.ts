import type { IModel } from "@sps/rbac/relations/widgets-to-website-builder-module-widgets/sdk/model";
import type {
  IComponentProps as IParent,
  IComponentPropsExtended as IParentExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
import type { ReactNode } from "react";
export const variant = "ai-chat-content" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  language?: string;
  mode: "project-create" | "authentication" | "registration" | "help";
  children?: ReactNode;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}
