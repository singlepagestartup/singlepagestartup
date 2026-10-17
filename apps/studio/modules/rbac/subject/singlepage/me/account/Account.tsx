"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { IAIChatUserProfile } from "../../../../../social/profile/singlepage/scope/ai-chat/project/models";
import type { RbacStudioAuthUser } from "../../../../shared";

export interface IAIChatAccount {
  subject?: { id: string };
  profile?: IAIChatUserProfile;
  email?: string;
  balance: { free: number; purchased: number } | null;
}
export interface IAccountContext {
  account: IAIChatAccount;
  signedIn?: boolean;
  user?: RbacStudioAuthUser;
  onSignIn?: (email: string) => void;
  onSignOut?: () => void;
  onProfileChange?: (
    updates: Partial<Omit<RbacStudioAuthUser, "email">>,
  ) => void;
  onEmailChange?: (email: string) => void;
}
const AccountContext = createContext<IAccountContext>({
  account: { balance: null },
});
const ProjectHrefContext = createContext("/ai-chat/social/profiles/create");
const ignoreAction = () => {};
export function AccountProvider({
  account,
  signedIn,
  user,
  onSignIn,
  onSignOut,
  onProfileChange,
  onEmailChange,
  projectHref = "/ai-chat/social/profiles/create",
  children,
}: IAccountContext & { projectHref?: string; children: ReactNode }) {
  return (
    <AccountContext.Provider
      value={{
        account,
        signedIn,
        user,
        onSignIn,
        onSignOut,
        onProfileChange,
        onEmailChange,
      }}
    >
      <ProjectHrefContext.Provider value={projectHref}>
        {children}
      </ProjectHrefContext.Provider>
    </AccountContext.Provider>
  );
}

/** Presentation data and callbacks supplied by the current example. */
export function useStudioAccount() {
  const context = useContext(AccountContext);
  return {
    account: context.account,
    user: context.user,
    signedIn: context.signedIn ?? Boolean(context.account.profile),
    signIn: context.onSignIn ?? ignoreAction,
    signOut: context.onSignOut ?? ignoreAction,
    updateProfile: context.onProfileChange ?? ignoreAction,
    updateEmail: context.onEmailChange ?? ignoreAction,
  };
}
export const useAIChatAccount = () => useStudioAccount().account;
export const useAIChatProjectHref = () => useContext(ProjectHrefContext);
