export { type IModel } from "@sps/ecommerce/models/order/sdk/model";
import { IModel } from "@sps/ecommerce/models/order/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
import { UseFormReturn } from "react-hook-form";

export const variant = "form-field-default" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  form: UseFormReturn<any>;
  formFieldName: string;
  entityFieldName: string;
  placeholder?: string;
  type?: any;
}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}
