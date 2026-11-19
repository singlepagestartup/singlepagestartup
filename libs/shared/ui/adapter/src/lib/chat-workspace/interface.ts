import type { ReactNode } from "react";

export interface IChatWorkspaceProps {
  navigation: ReactNode;
  navigationClassName?: string;
  navigationId?: string;
  children: ReactNode;
  className?: string;
}

export interface IChatThreadPanelProps {
  title: string;
  threadId?: string;
  pane?: "chat" | "context";
  onPaneChange?: (pane: "chat" | "context") => void;
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
