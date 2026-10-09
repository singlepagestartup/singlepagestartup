import { Component as WebsiteBuilderModuleWidget } from "../../../../../website-builder/widget/index";
import type { ReactNode } from "react";
import { type IAIChatHeaderProps } from "../../../../../website-builder/widget";

export interface IAIChatHeaderLayoutProps extends IAIChatHeaderProps {
  children: ReactNode;
}
export function Component({ children, ...header }: IAIChatHeaderLayoutProps) {
  return (
    <div
      data-sps-theme="singlepage"
      data-ds-block="host.layout.service-ai-chat"
      className="@container min-h-screen min-w-0 flex flex-col bg-sps-grey font-sps text-sps-graphite"
    >
      <WebsiteBuilderModuleWidget {...header} variant="header-ai-chat" />
      <div className="min-w-0 flex-1">{children}</div>
      <WebsiteBuilderModuleWidget variant="footer-ai-chat" />
    </div>
  );
}
