export const variant = "work-checkout";

export interface IWorkOrder {
  id: string;
  title: string;
  total: number;
  resultFilename?: string;
  invoiceId?: string;
  shipment?: { status: string; trackingCode?: string };
}

export interface IComponentProps {
  variant?: typeof variant;
  order: IWorkOrder;
  state: "locked" | "ready" | "pending" | "failed" | "paid" | "declined";
  onPay: () => void;
  onDiscussion: () => void;
  onRemove?: () => void;
}

export interface IComponentPropsExtended extends IComponentProps {}
