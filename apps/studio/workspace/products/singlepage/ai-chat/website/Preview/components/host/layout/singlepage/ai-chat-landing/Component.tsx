import type { ReactNode } from "react";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget/index";
import type { IWebsiteSection } from "../../../../website-builder/widget/singlepage/content/ai-chat/content";
export interface IAIChatLandingLayoutProps {
  children?: ReactNode;
  subjectAccount?: ReactNode;
  footerContent?: IWebsiteSection;
}
export function Component({
  children,
  subjectAccount,
  footerContent,
}: IAIChatLandingLayoutProps = {}) {
  return (
    <div
      data-workspace-projection="singlepage"
      lang="ru"
      data-ds-block="host.layout.ai-chat-landing"
      className="@container min-h-screen min-w-0 flex flex-col bg-[color:var(--workspace-brand-background)] font-[family-name:var(--workspace-brand-font-body)] text-[color:var(--workspace-brand-foreground)]"
    >
      <a
        href="#ai-chat-main"
        target="_self"
        className="sr-only focus:not-sr-only focus:block focus:px-6 focus:py-4 focus-visible:outline-2 focus-visible:outline-[color:var(--workspace-brand-accent)]"
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
