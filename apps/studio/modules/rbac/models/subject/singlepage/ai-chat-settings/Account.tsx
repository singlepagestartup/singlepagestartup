"use client";
import { createContext, useContext, type ReactNode } from "react";
import type {
  IAIChatUserProfile,
  ISubjectProfileRelation,
} from "../../../../../../workspace/utils/products/ai-chat-models";
export interface IAIChatAccount {
  subject?: { id: string };
  profiles?: IAIChatUserProfile[];
  subjectsToProfiles?: ISubjectProfileRelation[];
  email?: string;
  balance: { free: number; purchased: number } | null;
}
const AccountContext = createContext<IAIChatAccount>({ balance: null });
const WorkspaceHrefContext = createContext("/ai-chat/projects/new");
export function AccountProvider({
  account,
  workspaceHref = "/ai-chat/projects/new",
  children,
}: {
  account: IAIChatAccount;
  workspaceHref?: string;
  children: ReactNode;
}) {
  return (
    <AccountContext.Provider value={account}>
      <WorkspaceHrefContext.Provider value={workspaceHref}>
        {children}
      </WorkspaceHrefContext.Provider>
    </AccountContext.Provider>
  );
}
export const useAIChatAccount = () => useContext(AccountContext);
export const useAIChatWorkspaceHref = () => useContext(WorkspaceHrefContext);
