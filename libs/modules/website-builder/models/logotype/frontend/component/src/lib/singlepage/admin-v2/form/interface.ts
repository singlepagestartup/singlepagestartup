export { type IModel } from "@sps/website-builder/models/logotype/sdk/model";
import { IModel } from "@sps/website-builder/models/logotype/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/admin-v2/form/interface";
import { ReactNode } from "react";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "admin-v2-form" as const;

export type IComponentProps = IParentComponentProps<IModel, typeof variant> & {
  widgetsToLogotypes?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  logotypesToFileStorageModuleWidgets?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
};

export type IComponentPropsExtended = IParentComponentPropsExtended<
  IModel,
  typeof variant,
  IComponentProps
>;
