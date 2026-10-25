"use client";

import { usePreviewLayout } from "../ai-chat-landing/Navigation";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget/index";
import type { ReactNode } from "react";
import { type INavbarAiChatProps } from "../../../../website-builder/widget/index";
import { aiChatServiceHrefs } from "../ai-chat-landing/routes";

export interface IAIChatDashboardLayoutProps
  extends Pick<INavbarAiChatProps, "profileSelect" | "subjectAccount"> {
  page: "register" | "login" | "settings" | "help" | "tokens" | "chat";
  children: ReactNode;
}
export function Component({
  children,
  page,
  profileSelect,
  subjectAccount,
}: IAIChatDashboardLayoutProps) {
  const embedded = usePreviewLayout();
  if (embedded)
    return (
      <div
        lang="ru"
        className="@container min-w-0 font-[family-name:var(--workspace-brand-font-body)] text-[color:var(--workspace-brand-foreground)]"
      >
        {children}
      </div>
    );
  const accountAccess = page === "register" || page === "login";
  const buttonsArrayId =
    page === "register"
      ? "ai-chat-login"
      : page === "login"
        ? "ai-chat-register"
        : "ai-chat-help";
  return (
    <div
      lang="ru"
      data-workspace-projection="singlepage"
      data-ds-block="host.layout.ai-chat-dashboard"
      className="@container min-h-screen min-w-0 flex flex-col bg-[color:var(--workspace-brand-background)] font-[family-name:var(--workspace-brand-font-body)] text-[color:var(--workspace-brand-foreground)]"
    >
      <WebsiteBuilderModuleWidget
        variant="navbar-ai-chat"
        buttonsArrayId={buttonsArrayId}
        activeHref={
          page === "chat"
            ? undefined
            : aiChatServiceHrefs[
                page === "settings" ? "account-settings" : page
              ]
        }
        navigationLayout={accountAccess ? "inline" : "collapsible"}
        navigationLabel={accountAccess ? "Доступ к аккаунту" : "Меню аккаунта"}
        profileSelect={accountAccess ? undefined : profileSelect}
        subjectAccount={accountAccess ? undefined : subjectAccount}
      />
      <div className="min-w-0 flex-1">{children}</div>
      <WebsiteBuilderModuleWidget variant="footer-ai-chat" />
    </div>
  );
}
