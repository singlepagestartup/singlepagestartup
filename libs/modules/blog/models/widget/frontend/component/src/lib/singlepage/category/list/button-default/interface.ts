export { type IModel } from "@sps/blog/models/widget/sdk/model";
import { IModel } from "@sps/blog/models/widget/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";

export const variant = "category-list-button-default" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  language: string;
}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}
