export { type IModel } from "@sps/blog/models/article/sdk/model";
import { IModel } from "@sps/blog/models/article/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/admin-v2/form/interface";
import { ISpsComponentBase } from "@sps/ui-adapter";
import { ReactNode } from "react";

export const variant = "admin-v2-form" as const;

export type IComponentProps = IParentComponentProps<IModel, typeof variant> & {
  widgetsToArticles?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  articlesToEcommerceModuleProducts?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  categoriesToArticles?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  articlesToFileStorageModuleWidgets?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  articlesToWebsiteBuilderModuleWidgets?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
};

export type IComponentPropsExtended = IParentComponentPropsExtended<
  IModel,
  typeof variant,
  IComponentProps
>;
