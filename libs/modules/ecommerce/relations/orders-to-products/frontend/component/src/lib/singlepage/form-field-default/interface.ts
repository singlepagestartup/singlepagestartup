export { type IModel } from "@sps/ecommerce/relations/orders-to-products/sdk/model";
import { IModel } from "@sps/ecommerce/relations/orders-to-products/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
import { UseFormReturn } from "react-hook-form";

export const variant = "form-field-default" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  form: UseFormReturn<any>;
  field: string;
  placeholder?: string;
  name: string;
  type?: any;
}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}
