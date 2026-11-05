import type { ISpsComponentBase } from "@sps/ui-adapter";
import type { IModel } from "@sps/rbac/models/subject/sdk/model";
import type { IComponentProps as IAuthenticationProps } from "../../../../authentication/me-default/interface";

export const variant = "me-blog-module-article-create-default" as const;
export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  language: string;
  apiProps?: IAuthenticationProps["apiProps"];
}
export interface IComponentPropsExtended extends IComponentProps {
  data?: IModel;
  authenticated: boolean;
}
export interface IArticleDraft {
  title: string;
  summary: string;
  body: string;
  categoryId: string;
}
