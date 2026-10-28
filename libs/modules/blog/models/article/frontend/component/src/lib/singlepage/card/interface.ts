import type { IModel } from "@sps/blog/models/article/sdk/model";
import type {
  IComponentProps as IParent,
  IComponentPropsExtended as IParentExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
export const variant = "card" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  language: string;
  layout?: "module" | "guide";
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}

export interface IMediaProps {
  articleId: string;
  language: string;
  isServer: boolean;
  guide?: boolean;
}
