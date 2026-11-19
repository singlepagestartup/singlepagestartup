export const variant = "customer-work";

export interface IWorkMessage {
  id: string;
  author: string;
  kind: "customer" | "operator" | "event";
  body: string;
}

export interface IWorkResultVersion {
  id: string;
  number: number;
  title: string;
  sections: readonly string[];
  pages: number;
}

export interface IComponentProps {
  variant?: typeof variant;
  title: string;
  reference: string;
  orderId?: string;
  operator: string;
  handoff: "assistant" | "pending" | "manager";
  messages: readonly IWorkMessage[];
  versions?: readonly IWorkResultVersion[];
  acceptedVersionId?: string;
  resultStatus?: "preparing" | "review" | "accepted" | "declined" | "paid";
  price: number;
  onSend: (message: string) => void;
  onHandoff: () => void;
  onAddToCart?: () => void;
  onRevision?: () => void;
  onAccept: (versionId: string) => void;
  onDecline: () => void;
  onCheckout: () => void;
}

export interface IComponentPropsExtended extends IComponentProps {}
