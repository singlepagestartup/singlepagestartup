export { type IModel } from "@sps/billing/models/payment-intent/sdk/model";
import { IModel } from "@sps/billing/models/payment-intent/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/admin-v2/form/interface";
import { ISpsComponentBase } from "@sps/ui-adapter";
import { ReactNode } from "react";

export const variant = "admin-v2-form" as const;

export type IComponentProps = IParentComponentProps<IModel, typeof variant> & {
  paymentIntentsToInvoices?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  paymentIntentsToCurrencies?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
};

export type IComponentPropsExtended = IParentComponentPropsExtended<
  IModel,
  typeof variant,
  IComponentProps
>;
