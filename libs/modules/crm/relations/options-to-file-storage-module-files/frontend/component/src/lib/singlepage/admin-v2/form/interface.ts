export { type IModel } from "@sps/crm/relations/options-to-file-storage-module-files/sdk/model";
import { IModel } from "@sps/crm/relations/options-to-file-storage-module-files/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/admin-v2/form/interface";

export const variant = "admin-v2-form" as const;

export type IComponentProps = IParentComponentProps<IModel, typeof variant>;

export type IComponentPropsExtended = IParentComponentPropsExtended<
  IModel,
  typeof variant,
  IComponentProps
>;
