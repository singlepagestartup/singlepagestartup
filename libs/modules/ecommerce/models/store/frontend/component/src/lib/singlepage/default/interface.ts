export { type IModel } from "@sps/ecommerce/models/store/sdk/model";
import { IModel } from "@sps/ecommerce/models/store/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";

export const variant = "default" as const;

export interface IComponentProps extends IParentComponentProps<
  IModel,
  typeof variant
> {
  language: string;
  /** Classification marker used by Store card variants sharing this view. */
  dataVariant?: IModel["variant"];
}

export interface IComponentPropsExtended extends IParentComponentPropsExtended<
  IModel,
  typeof variant,
  IComponentProps
> {}
