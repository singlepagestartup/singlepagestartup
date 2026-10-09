"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { IAIChatUserProfile } from "../../../../../../workspace/utils/products/ai-chat-models";
export interface IAIChatAccount {
  subject?: { id: string };
  profile?: IAIChatUserProfile;
  email?: string;
  balance: { free: number; purchased: number } | null;
}
const AccountContext = createContext<IAIChatAccount>({ balance: null });
const ProjectHrefContext = createContext("/ai-chat/projects/new");
export function AccountProvider({
  account,
  projectHref = "/ai-chat/projects/new",
  children,
}: {
  account: IAIChatAccount;
  projectHref?: string;
  children: ReactNode;
}) {
  return (
    <AccountContext.Provider value={account}>
      <ProjectHrefContext.Provider value={projectHref}>
        {children}
      </ProjectHrefContext.Provider>
    </AccountContext.Provider>
  );
}
export const useAIChatAccount = () => useContext(AccountContext);
export const useAIChatProjectHref = () => useContext(ProjectHrefContext);
