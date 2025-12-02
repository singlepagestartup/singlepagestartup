import { ReactNode } from "react";
import { ISpsComponentBase } from "@sps/ui-adapter";
export { type IModel } from "@sps/social/models/profile/sdk/model";
import { IModel } from "@sps/social/models/profile/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/admin/form/interface";

export const variant = "admin-form" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  profilesToFileStorageModuleFiles?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  profilesToWebsiteBuilderModuleWidgets?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  profilesToAttributes?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  profilesToChats?: (props: ISpsComponentBase & { data?: IModel }) => ReactNode;
  profilesToMessages?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  profilesToActions?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  profilesToEcommerceModuleProducts?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}
