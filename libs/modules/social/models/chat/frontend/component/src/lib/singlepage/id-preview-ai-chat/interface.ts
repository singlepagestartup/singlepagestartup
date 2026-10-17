import type { IComponentPropsExtended as IParentExtended } from "@sps/shared-frontend-components/singlepage/default/interface";
import type { IModel } from "@sps/social/models/chat/sdk/model";
import type { IComponentProps as IParent } from "@sps/shared-frontend-components/singlepage/default/interface";

export const variant = "id-preview-ai-chat" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}
