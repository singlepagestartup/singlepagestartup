import type { ReactNode } from "react";

export interface IChatWorkspaceProps {
  navigation: ReactNode;
  navigationClassName?: string;
  navigationId?: string;
  siteLayout?: boolean;
  children: ReactNode;
  className?: string;
}

export interface IChatWorkspaceNavigationProps {
  label: string;
  title: string;
  heading?: "h1" | "h2";
  leading?: ReactNode;
  actions?: ReactNode;
  search: {
    label: string;
    value: string;
    onChange: (value: string) => void;
  };
  children: ReactNode;
  footer?: ReactNode;
}

export interface IChatListActivityProps {
  language: string;
  timestamp?: Date | string | null;
  unreadCount?: number;
}

export interface IChatThreadPanelProps {
  title: string;
  threadId?: string;
  pane?: "chat" | "context";
  onPaneChange?: (pane: "chat" | "context") => void;
  /** Defaults to open at xl and closed on smaller screens. */
  contextOpen?: boolean;
  onContextOpenChange?: (open: boolean) => void;
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
