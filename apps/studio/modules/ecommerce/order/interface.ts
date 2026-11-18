export type { IRecord as IModel } from "./singlepage/admin-v2-table/interface";

export type OrderPaymentStatus = "paid" | "awaiting-payment" | "cancelled";

export interface IOrderCharge {
  id: string;
  title: string;
  kind: "product" | "delivery" | "add-on";
  quantity: number;
  amount: number;
  seller: string;
  fulfilledBy?: string;
  schedule?: "first-delivery" | "every-delivery";
}

export interface IOrderInvoice {
  id: string;
  currency: string;
  amount: number;
  status: OrderPaymentStatus;
  orderIds: string[];
  description: string;
  legacy?: boolean;
}

export interface IOrderHistoryItem {
  id: string;
  title: string;
  seller: string;
  offerId: string;
  quantity: number;
  currency: string;
  amount: number | null;
  status: OrderPaymentStatus;
  invoiceId: string;
  date: string;
  fulfilment: string;
  charges: IOrderCharge[];
  note?: string;
  periodLabel?: string;
}

export interface IOrderSubscriptionPeriod {
  id: string;
  label: string;
  date: string;
  currency: string;
  amount: number;
  charges: IOrderCharge[];
  paymentMode: "automatic" | "separate-payment";
  note: string;
}

import type { ComponentProps } from "react";
import type { variants } from "./variants";
export type IComponentProps = {
  [Variant in keyof typeof variants]: { variant: Variant } & Omit<
    NonNullable<ComponentProps<(typeof variants)[Variant]>>,
    "variant"
  >;
}[keyof typeof variants];

export interface ISkeletonProps {
  variant?: IComponentProps["variant"];
  className?: string;
  rows?: number;
}
