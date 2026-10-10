import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget/index";
import type { ReactNode } from "react";
import { type INavbarAiChatProps } from "../../../../website-builder/widget";

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
  const accountAccess = page === "register" || page === "login";
  const buttonsArrayId =
    page === "register"
      ? "ai-chat-login"
      : page === "login"
        ? "ai-chat-register"
        : "ai-chat-help";
  return (
    <div
      data-sps-theme="singlepage"
      data-ds-block="host.layout.ai-chat-dashboard"
      className="@container min-h-screen min-w-0 flex flex-col bg-sps-grey font-sps text-sps-graphite"
    >
      <WebsiteBuilderModuleWidget
        variant="navbar-ai-chat"
        buttonsArrayId={buttonsArrayId}
        activeHref={`/ai-chat/${page}`}
        navigationLayout={accountAccess ? "inline" : "collapsible"}
        navigationLabel={
          accountAccess ? "Account access" : "Account navigation"
        }
        profileSelect={accountAccess ? undefined : profileSelect}
        subjectAccount={accountAccess ? undefined : subjectAccount}
      />
      <div className="min-w-0 flex-1">{children}</div>
      <WebsiteBuilderModuleWidget variant="footer-ai-chat" />
    </div>
  );
}
