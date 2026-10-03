export { type IModel } from "@sps/social/relations/profiles-to-blog-module-articles/sdk/model";
import { IModel } from "@sps/social/relations/profiles-to-blog-module-articles/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/admin-v2/form/interface";

export const variant = "admin-v2-form" as const;

interface IFormDefaults {
  defaultProfileId?: string;
  defaultBlogModuleArticleId?: string;
}

export type IComponentProps = IParentComponentProps<IModel, typeof variant> &
  IFormDefaults;

export type IComponentPropsExtended = IParentComponentPropsExtended<
  IModel,
  typeof variant,
  IComponentProps
>;
