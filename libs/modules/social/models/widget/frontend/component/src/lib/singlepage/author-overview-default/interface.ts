import type { IModel } from "@sps/social/models/widget/sdk/model";
import type {
  IComponentProps as IParent,
  IComponentPropsExtended as IParentExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";

export const variant = "author-overview-default" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  language: string;
  profileId?: string;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}
