export { type IModel } from "@sps/crm/models/input/sdk/model";
import { IModel } from "@sps/crm/models/input/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
import { UseFormReturn } from "react-hook-form";

export const variant = "text-default" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  language: string;
  form: UseFormReturn<any>;
  disabled?: boolean;
}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}
