import { ReactNode } from "react";
import { ISpsComponentBase } from "@sps/ui-adapter";
export { type IModel } from "@sps/social/models/message/sdk/model";
import { IModel } from "@sps/social/models/message/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/admin-v2/form/interface";

export const variant = "admin-v2-form" as const;

export type IComponentProps = IParentComponentProps<IModel, typeof variant> & {
  profilesToMessages?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  chatsToMessages?: (props: ISpsComponentBase & { data?: IModel }) => ReactNode;
  messagesToFileStorageModuleFiles?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
};

export type IComponentPropsExtended = IParentComponentPropsExtended<
  IModel,
  typeof variant,
  IComponentProps
>;
