export { type IModel } from "@sps/website-builder/relations/sliders-to-slides/sdk/model";
import { IModel } from "@sps/website-builder/relations/sliders-to-slides/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/admin-v2/table-row/interface";

export const variant = "admin-v2-table-row" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}
