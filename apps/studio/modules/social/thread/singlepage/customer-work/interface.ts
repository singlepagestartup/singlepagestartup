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

export interface IWorkResultFile {
  id: string;
  filename: string;
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
  files?: readonly IWorkResultFile[];
  acceptedFileId?: string;
  resultStatus?: "preparing" | "review" | "accepted" | "declined" | "paid";
  price: number;
  delivery?: ReactNode;
  onSend: (message: string, attachments: SocialPreviewAttachment[]) => void;
  onHandoff: () => void;
  onAddToCart?: () => void;
  onRevision?: () => void;
  onAccept: (fileId: string) => void;
  onDecline: () => void;
  onCheckout: () => void;
}

export interface IComponentPropsExtended extends IComponentProps {}
