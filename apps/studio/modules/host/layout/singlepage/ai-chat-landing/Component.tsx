import type { IComponentProps, IAIChatLandingLayoutProps } from "./interface";
export type { IAIChatLandingLayoutProps } from "./interface";
import type { ReactNode } from "react";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget/index";
import type { IWebsiteSection } from "../../../../website-builder/widget/singlepage/content/ai-chat/content";

export function Component({
  variant = "ai-chat-landing",
  children,
  subjectAccount,
  footerContent,
}: IComponentProps = {}) {
  return (
    <div
      data-sps-theme="singlepage"
      lang="ru"
      data-ds-block="host.layout.ai-chat-landing"
      className="@container min-h-screen min-w-0 flex flex-col bg-muted font-default text-foreground"
      data-module="host"
      data-model="layout"
      data-variant={variant}
    >
      <a
        href="#ai-chat-main"
        target="_self"
        className="sr-only focus:not-sr-only focus:block focus:px-6 focus:py-4 focus-visible:outline-2 focus-visible:outline-primary"
      >
        Перейти к содержимому
      </a>
      <WebsiteBuilderModuleWidget
        variant="navbar-ai-chat-landing"
        subjectAccount={subjectAccount}
      />
      <div className="min-w-0 flex-1">{children}</div>
      <WebsiteBuilderModuleWidget
        variant="footer-ai-chat"
        content={footerContent}
      />
    </div>
  );
}
