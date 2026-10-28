import type { ReactNode } from "react";
export { type IModel } from "@sps/blog/models/article/sdk/model";
import { IModel } from "@sps/blog/models/article/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";

export const variant = "overview-default" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  language: string;
  author?: ReactNode;
  authorCard?: ReactNode;
  navigation?: ReactNode;
  commentsContent?: ReactNode;
}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}

export interface IClientComponentProps {
  articleId: string;
  variant: typeof variant;
  language: string;
  title: string;
  className?: string;
  dateTime?: string;
  dateLabel?: string;
  categories: ReactNode;
  subtitle?: ReactNode;
  author?: ReactNode;
  authorCard?: ReactNode;
  media: ReactNode;
  body?: ReactNode;
  content?: ReactNode;
  publicContent?: ReactNode;
  navigation?: ReactNode;
  commentsContent?: ReactNode;
}

export interface IArticleHeading {
  id: string;
  title: string;
}
