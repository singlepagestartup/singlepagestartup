export { type IModel } from "@sps/ecommerce/models/store/sdk/model";
import { IModel } from "@sps/ecommerce/models/store/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";

export const variant = "default" as const;

export interface IComponentProps<
  TVariant extends string = typeof variant,
> extends IParentComponentProps<IModel, TVariant> {
  language: string;
}

export interface IComponentPropsExtended extends IParentComponentPropsExtended<
  IModel,
  string,
  IComponentProps<string>
> {}
