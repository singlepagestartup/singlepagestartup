import type { ReactNode } from "react";
import type { SocialPreviewAttachment } from "../../../widget/singlepage/chat-overview-default/utils";

export const variant = "customer-work";

export interface IWorkMessage {
  id: string;
  author: string;
  kind: "customer" | "operator" | "event";
  body: string;
  attachments?: SocialPreviewAttachment[];
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
  delivery?: ReactNode;
  onSend: (message: string, attachments: SocialPreviewAttachment[]) => void;
  onHandoff: () => void;
  onAddToCart?: () => void;
  onRevision?: () => void;
  onAccept: (versionId: string) => void;
  onDecline: () => void;
  onCheckout: () => void;
}

export interface IComponentPropsExtended extends IComponentProps {}
