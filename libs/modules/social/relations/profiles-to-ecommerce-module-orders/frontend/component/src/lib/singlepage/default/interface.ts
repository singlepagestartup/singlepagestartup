export { type IModel } from "@sps/social/relations/profiles-to-ecommerce-module-orders/sdk/model";
import { IModel } from "@sps/social/relations/profiles-to-ecommerce-module-orders/sdk/model";
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
  children?: import("react").ReactNode;
}

export interface IComponentPropsExtended extends IParentComponentPropsExtended<
  IModel,
  typeof variant,
  IComponentProps
> {}
