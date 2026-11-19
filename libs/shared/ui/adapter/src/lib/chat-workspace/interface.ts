import type { ReactNode } from "react";

export interface IChatWorkspaceProps {
  navigation: ReactNode;
  children: ReactNode;
  className?: string;
}

export interface IChatThreadPanelProps {
  title: string;
  threadId?: string;
  pane?: "chat" | "document";
  onPaneChange?: (pane: "chat" | "document") => void;
  language?: string;
  isDocument?: boolean;
  isProjectThread?: boolean;
  navigation?: ReactNode;
  messages: ReactNode;
  messagesOwnScroll?: boolean;
  composer: ReactNode;
  knowledge?: ReactNode;
  documentDownload?: ReactNode;
  context?: ReactNode;
}
