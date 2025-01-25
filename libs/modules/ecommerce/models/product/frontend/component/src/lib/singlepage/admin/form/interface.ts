export { type IModel } from "@sps/ecommerce/models/product/sdk/model";
import { IModel } from "@sps/ecommerce/models/product/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/admin-form/interface";
import { ReactNode } from "react";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "admin-form" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  productsToAttributes?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  productsToFileStorageModuleWidgets?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  productsToWebsiteBuilderModuleWidgets?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  ordersToProducts?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  categoriesToProducts?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  storesToProducts?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  widgetsToProducts?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}
