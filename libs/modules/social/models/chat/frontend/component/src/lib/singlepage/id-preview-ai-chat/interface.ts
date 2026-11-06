import {
  type IComponentPropsExtended as IParentExtended,
  type IComponentProps as IParent,
} from "@sps/shared-frontend-components/singlepage/default/interface";
import type { IModel } from "@sps/social/models/chat/sdk/model";

export const variant = "id-preview-ai-chat" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}
