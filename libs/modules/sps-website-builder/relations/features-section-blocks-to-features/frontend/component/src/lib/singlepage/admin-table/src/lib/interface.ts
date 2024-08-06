export { type IRelation } from "@sps/sps-website-builder/relations/features-section-blocks-to-features/sdk/model";
import { IRelation } from "@sps/sps-website-builder/relations/features-section-blocks-to-features/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/admin-table/interface";

export const variant = "admin-table" as const;

export interface IComponentProps
  extends IParentComponentProps<IRelation, typeof variant> {}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IRelation,
    typeof variant,
    IComponentProps
  > {}
