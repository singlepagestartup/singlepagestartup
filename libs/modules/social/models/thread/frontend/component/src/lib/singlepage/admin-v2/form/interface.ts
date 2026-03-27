import { ReactNode } from "react";
import { ISpsComponentBase } from "@sps/ui-adapter";
export { type IModel } from "@sps/social/models/thread/sdk/model";
import { IModel } from "@sps/social/models/thread/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/admin-v2/form/interface";

export const variant = "admin-v2-form" as const;

export type IComponentProps = IParentComponentProps<IModel, typeof variant> & {
  chatsToThreads?: (props: ISpsComponentBase & { data?: IModel }) => ReactNode;
  threadsToMessages?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  threadsToEcommerceModuleProducts?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
};

export type IComponentPropsExtended = IParentComponentPropsExtended<
  IModel,
  typeof variant,
  IComponentProps
>;
