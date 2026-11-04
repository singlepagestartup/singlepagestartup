import type { IModel as IBillingModuleCurrency } from "@sps/billing/models/currency/sdk/model";
import type { ReactNode } from "react";
export { type IModel } from "@sps/ecommerce/models/product/sdk/model";
import { IModel } from "@sps/ecommerce/models/product/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
import { UseFormReturn } from "react-hook-form";

export const variant = "currency-toggle-group-default" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  onCurrenciesResolved?: (currencies: IBillingModuleCurrency[]) => void;
  formFieldName: string;
  form: UseFormReturn<any>;
  label?: string;
  renderField?: keyof IModel;
}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}

export interface IClientComponentProps {
  currencies?: IBillingModuleCurrency[];
  onCurrenciesResolved?: IComponentProps["onCurrenciesResolved"];
  children?: ReactNode;
}
