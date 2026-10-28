export { type IModel } from "@sps/social/relations/profiles-to-blog-module-articles/sdk/model";
import { IModel } from "@sps/social/relations/profiles-to-blog-module-articles/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";

export const variant = "author-default" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  language: string;
  size?: "xs" | "sm";
  inverse?: boolean;
}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}
