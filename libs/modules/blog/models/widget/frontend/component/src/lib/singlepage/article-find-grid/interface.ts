import type { IModel } from "@sps/blog/models/widget/sdk/model";
import type {
  IComponentProps as IParent,
  IComponentPropsExtended as IParentExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
export const variant = "article-find-grid" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  language: string;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}

export interface IPresentationProps {
  data: IModel;
  language: string;
  isServer: boolean;
  className?: string;
  variant: "article-find-grid" | "article-find-guides";
  layout: "module" | "guide";
}
