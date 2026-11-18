import type { IOrderHistoryItem, IOrderInvoice } from "../../interface";

export const variant = "history-default";

export interface IComponentProps {
  variant?: "history-default";
  orders?: IOrderHistoryItem[];
  invoices?: IOrderInvoice[];
  expanded?: boolean;
  title?: string;
  description?: string;
}

export interface IComponentPropsExtended extends IComponentProps {}
