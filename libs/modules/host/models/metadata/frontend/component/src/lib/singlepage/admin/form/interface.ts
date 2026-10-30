import type { Control } from "react-hook-form";
import type { IInsertSchema } from "@sps/host/models/metadata/sdk/model";
export { type IModel } from "@sps/host/models/metadata/sdk/model";
import { IModel } from "@sps/host/models/metadata/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/admin/form/interface";
import { ReactNode } from "react";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "admin-form" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  preview?: (props: {
    control: Control<IInsertSchema>;
    metadataId?: string;
  }) => ReactNode;
  metadataToFileStorageModuleFiles?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  pagesToMetadata?: (props: ISpsComponentBase & { data?: IModel }) => ReactNode;
}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}
