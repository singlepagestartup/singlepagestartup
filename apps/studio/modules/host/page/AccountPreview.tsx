"use client";

import type { MouseEvent } from "react";
import {
  AccountProvider,
  type IAIChatAccount,
} from "../../rbac/subject/singlepage/me/account/Account";
import { aiChatAccount } from "../../rbac/subject/singlepage/me/account/fixture";
import { NavigationProvider } from "../layout/singlepage/ai-chat-landing/Navigation";
import { Component as Page, type ILoginPageProps } from "./index";

export interface IAccountPreviewProps {
  loginCopy?: ILoginPageProps["copy"];
  initialHref: string;
  account?: IAIChatAccount;
  signedIn?: boolean;
  onNavigate?: (href: string) => void;
}

const routes = {
  "/rbac/subject/authentication/email-and-password":
    "rbac-module-subject-me-authentication-select-method-ai-chat",
  "/rbac/subject/authentication/email-and-password/registration":
    "rbac-module-subject-me-authentication-registration-ai-chat",
  "/rbac/subjects/settings": "rbac-module-subject-me-settings-ai-chat",
  "/framework/help": "ai-chat-help",
  "/ecommerce":
    "rbac-module-subject-me-ecommerce-module-order-checkout-tokens-ai-chat",
} as const;

export function AccountPreview({
  loginCopy,
  initialHref,
  account = aiChatAccount,
  signedIn,
  onNavigate = () => {},
}: IAccountPreviewProps) {
  const variant = routes[initialHref as keyof typeof routes];
  if (!variant) return <main role="status">Страница недоступна.</main>;

  function followLink(event: MouseEvent<HTMLDivElement>) {
    const anchor = (event.target as Element).closest("a");
    if (
      !anchor ||
      anchor.hasAttribute("download") ||
      (anchor.target && anchor.target !== "_self") ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const href = anchor.getAttribute("href");
    if (!href || !(href in routes)) return;
    event.preventDefault();
    onNavigate(href);
  }

  return (
    <AccountProvider
      account={account}
      signedIn={signedIn ?? !initialHref.includes("/authentication/")}
    >
      <NavigationProvider navigate={onNavigate}>
        <div onClick={followLink} data-preview-href={initialHref}>
          {variant ===
          "rbac-module-subject-me-authentication-select-method-ai-chat" ? (
            <Page variant={variant} copy={loginCopy} />
          ) : (
            <Page variant={variant} />
          )}
        </div>
      </NavigationProvider>
    </AccountProvider>
  );
}
