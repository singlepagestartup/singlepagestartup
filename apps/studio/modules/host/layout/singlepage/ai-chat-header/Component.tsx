import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget/index";
import type { ReactNode } from "react";
import { type IAIChatHeaderProps } from "../../../../website-builder/widget/singlepage/ai-chat-header/index";

export interface IAIChatHeaderLayoutProps extends IAIChatHeaderProps {
  children: ReactNode;
}
export function Component({ children, ...header }: IAIChatHeaderLayoutProps) {
  return (
    <div
      data-sps-theme="singlepage"
      data-ds-block="host.layout.ai-chat-header"
      className="@container min-h-screen min-w-0 bg-sps-grey font-sps text-sps-graphite"
    >
      <WebsiteBuilderModuleWidget {...header} variant="ai-chat-header" />
      {children}
    </div>
  );
}
