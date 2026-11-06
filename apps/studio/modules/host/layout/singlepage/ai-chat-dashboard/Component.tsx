import type { IComponentProps, IAIChatDashboardLayoutProps } from "./interface";
export type { IAIChatDashboardLayoutProps } from "./interface";
import {
  Component as WebsiteBuilderModuleWidget,
  type INavbarAiChatProps,
} from "../../../../website-builder/widget/index";
import type { ReactNode } from "react";
import { aiChatServiceHrefs } from "../ai-chat-landing/routes";

export function Component({
  variant = "ai-chat-dashboard",
  children,
  page,
  profileSelect,
  subjectAccount,
}: IComponentProps) {
  const accountAccess = page === "register" || page === "login";
  const buttonsArrayId = accountAccess ? "empty" : "ai-chat-help";
  return (
    <div
      data-sps-theme="singlepage"
      data-ds-block="host.layout.ai-chat-dashboard"
      className="@container min-h-screen min-w-0 flex flex-col bg-muted font-default text-foreground"
      data-module="host"
      data-model="layout"
      data-variant={variant}
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
        subjectAccount={subjectAccount}
      />
      <div className="min-w-0 flex-1">{children}</div>
      <WebsiteBuilderModuleWidget
        variant="footer-ai-chat"
        className="w-full px-4 @[800px]:px-8"
      />
    </div>
  );
}
