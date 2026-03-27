import { ReactNode } from "react";
import { ISpsComponentBase } from "@sps/ui-adapter";
export { type IModel } from "@sps/social/models/profile/sdk/model";
import { IModel } from "@sps/social/models/profile/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/admin-v2/form/interface";

export const variant = "admin-v2-form" as const;

export type IComponentProps = IParentComponentProps<IModel, typeof variant> & {
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
};

export type IComponentPropsExtended = IParentComponentPropsExtended<
  IModel,
  typeof variant,
  IComponentProps
>;
