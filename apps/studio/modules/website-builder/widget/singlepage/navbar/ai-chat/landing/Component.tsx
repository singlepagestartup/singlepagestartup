import type { ReactNode } from "react";
import { Component as WebsiteBuilderModuleLogotype } from "../../../../../logotype";
import { Component as WebsiteBuilderModuleButtonsArray } from "../../../../../buttons-array";

export interface INavbarAiChatLandingProps {
  subjectAccount?: ReactNode;
}
export function Component({ subjectAccount }: INavbarAiChatLandingProps = {}) {
  return (
    <header
      data-ds-block="website-builder.widget.navbar-ai-chat-landing"
      className="sticky top-0 z-40 border-b border-sps-line bg-sps-grey"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-4 @3xl:px-8">
        <WebsiteBuilderModuleLogotype variant="brand-ai-chat" />
        <nav aria-label="AI Chat" className="flex items-center gap-1">
          <WebsiteBuilderModuleButtonsArray
            variant="navbar-ai-chat"
            id="ai-chat-try"
          />
          {subjectAccount}
        </nav>
      </div>
    </header>
  );
}
