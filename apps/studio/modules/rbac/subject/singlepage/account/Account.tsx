"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { IAIChatUserProfile } from "../../../../../workspace/utils/products/ai-chat-models";
import {
  clearRbacStudioAuthUser,
  readRbacStudioAuthUser,
  writeRbacStudioAuthUser,
  RBAC_STUDIO_AUTH_CHANGE_EVENT,
  type RbacAccountUser,
} from "../../../shared";

export interface IAIChatAccount {
  subject?: { id: string };
  profile?: IAIChatUserProfile;
  email?: string;
  balance: { free: number; purchased: number } | null;
}
export interface IAccountContext {
  account: IAIChatAccount;
  signedIn?: boolean;
}
const AccountContext = createContext<IAccountContext>({
  account: { balance: null },
});
const ProjectHrefContext = createContext("/ai-chat/projects/new");
export function AccountProvider({
  account,
  signedIn,
  projectHref = "/ai-chat/projects/new",
  children,
}: IAccountContext & { projectHref?: string; children: ReactNode }) {
  return (
    <AccountContext.Provider value={{ account, signedIn }}>
      <ProjectHrefContext.Provider value={projectHref}>
        {children}
      </ProjectHrefContext.Provider>
    </AccountContext.Provider>
  );
}

/** Local preview session shared by AI Chat and website account controls. */
export function useStudioAccount() {
  const context = useContext(AccountContext);
  const [stored, setStored] = useState(() => readRbacStudioAuthUser());
  const [sessionSignedIn, setSessionSignedIn] = useState<boolean>();
  useEffect(() => {
    function syncUser() {
      const user = readRbacStudioAuthUser();
      setStored(user);
      setSessionSignedIn(Boolean(user));
    }
    window.addEventListener("storage", syncUser);
    window.addEventListener(RBAC_STUDIO_AUTH_CHANGE_EVENT, syncUser);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener(RBAC_STUDIO_AUTH_CHANGE_EVENT, syncUser);
    };
  }, []);
  const signedIn =
    sessionSignedIn ??
    (stored ? true : (context.signedIn ?? Boolean(context.account.profile)));
  const account: IAIChatAccount = {
    ...context.account,
    email: stored?.email ?? context.account.email,
    profile: signedIn
      ? stored
        ? {
            id: context.account.profile?.id ?? stored.slug,
            title: stored.name,
            avatar: stored.avatar,
            variant: "ai-chat-user",
          }
        : context.account.profile
      : undefined,
  };
  function signIn(email: string) {
    const user = writeRbacStudioAuthUser(email);
    setStored(user);
    setSessionSignedIn(true);
  }
  function signOut() {
    clearRbacStudioAuthUser();
    setStored(null);
    setSessionSignedIn(false);
  }
  function updateAvatar(avatar: string, previewUser?: RbacAccountUser) {
    const user = writeRbacStudioAuthUser(
      previewUser?.email ?? account.email ?? "alex@example.com",
      {
        name: previewUser?.name ?? account.profile?.title ?? "Alex",
        avatar,
      },
    );
    setStored(user);
    setSessionSignedIn(true);
  }
  return { account, signedIn, signIn, signOut, updateAvatar };
}
export const useAIChatAccount = () => useStudioAccount().account;
export const useAIChatProjectHref = () => useContext(ProjectHrefContext);
