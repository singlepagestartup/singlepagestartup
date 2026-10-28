import {
  type IComponentPropsExtended as IParentExtended,
  type IComponentProps as IParent,
} from "@sps/shared-frontend-components/singlepage/default/interface";
import type { IModel } from "@sps/website-builder/models/widget/sdk/model";

export const variant = "content-ai-chat-materials-processing" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  id?: string;
  language?: string;
  open?: boolean;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}
