import type { ReactNode } from "react";
import { Component as WebsiteBuilderModuleWidget } from "../../../../../website-builder/widget";
import type { IWebsiteSection } from "../../../../../../workspace/utils/products/ai-chat-content";
export interface IAIChatLayoutProps {
  children?: ReactNode;
  subjectAccount?: ReactNode;
  footerContent?: IWebsiteSection;
}
export function Component({
  children,
  subjectAccount,
  footerContent,
}: IAIChatLayoutProps = {}) {
  return (
    <div
      data-sps-theme="singlepage"
      data-ds-block="host.layout.landing-ai-chat"
      className="@container min-h-screen min-w-0 flex flex-col bg-sps-grey font-sps text-sps-graphite"
    >
      <a
        href="#ai-chat-main"
        target="_self"
        className="sr-only focus:not-sr-only focus:block focus:px-6 focus:py-4 focus-visible:outline-2 focus-visible:outline-sps-green"
      >
        Skip to page content
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
