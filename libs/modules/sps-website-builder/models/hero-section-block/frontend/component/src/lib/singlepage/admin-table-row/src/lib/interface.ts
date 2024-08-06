export { type IModel } from "@sps/sps-website-builder/models/hero-section-block/sdk/model";
import { IModel } from "@sps/sps-website-builder/models/hero-section-block/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/admin-table-row/interface";

export const variant = "admin-table-row" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}
