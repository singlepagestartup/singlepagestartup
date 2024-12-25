export { type IModel } from "@sps/billing/models/currency/sdk/model";
import { IModel } from "@sps/billing/models/currency/sdk/model";
import { IFindByIdActionProps } from "@sps/shared-frontend-api";
import { ISpsComponentBase } from "@sps/ui-adapter";
import { ReactNode } from "react";
import { UseFormReturn } from "react-hook-form";

export const variant = "toggle-group-default" as const;

export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  apiProps?: {
    params?: IFindByIdActionProps["params"];
    options?: IFindByIdActionProps["options"];
  };
  children?: ReactNode;
  className?: string;
  formFieldName: string;
  form: UseFormReturn<any>;
  label?: string;
  renderField?: keyof IModel;
}

export interface IComponentPropsExtended extends IComponentProps {
  data: IModel[];
}
