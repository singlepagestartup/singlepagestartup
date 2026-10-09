import { Component as WebsiteBuilderModuleWidget } from "../../../../../website-builder/widget/index";
import type { ReactNode } from "react";
import { type INavbarAiChatProps } from "../../../../../website-builder/widget";

export interface IServiceAiChatLayoutProps extends INavbarAiChatProps {
  children: ReactNode;
}
export function Component({ children, ...navbar }: IServiceAiChatLayoutProps) {
  return (
    <div
      data-sps-theme="singlepage"
      data-ds-block="host.layout.service-ai-chat"
      className="@container min-h-screen min-w-0 flex flex-col bg-sps-grey font-sps text-sps-graphite"
    >
      <WebsiteBuilderModuleWidget {...navbar} variant="navbar-ai-chat" />
      <div className="min-w-0 flex-1">{children}</div>
      <WebsiteBuilderModuleWidget variant="footer-ai-chat" />
    </div>
  );
}
