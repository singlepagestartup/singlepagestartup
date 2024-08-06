export { type IModel } from "@sps/sps-rbac/relations/subjects-to-identities/sdk/model";
import { IModel } from "@sps/sps-rbac/relations/subjects-to-identities/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/admin-table/interface";

export const variant = "admin-table" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}
