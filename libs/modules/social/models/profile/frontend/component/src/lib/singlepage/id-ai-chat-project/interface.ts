import {
  type IComponentPropsExtended as IParentExtended,
  type IComponentProps as IParent,
} from "@sps/shared-frontend-components/singlepage/default/interface";
import type { IModel } from "@sps/social/models/profile/sdk/model";

export const variant = "id-ai-chat-project" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  navigation: React.ReactNode;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}
