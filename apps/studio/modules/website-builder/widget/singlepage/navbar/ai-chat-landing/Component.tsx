import type { IComponentProps, INavbarAiChatLandingProps } from "./interface";
export type { INavbarAiChatLandingProps } from "./interface";
import type { ReactNode } from "react";
import { Component as Logotype } from "../../../../logotype/index";
import { Component as ButtonsArray } from "../../../../buttons-array/index";

export function Component({
  variant = "navbar-ai-chat-landing",
  subjectAccount,
}: IComponentProps = {}) {
  return (
    <header
      data-ds-block="website-builder.widget.navbar-ai-chat-landing"
      className="sticky top-0 z-40 border-b border-border bg-muted"
      data-module="website-builder"
      data-model="widget"
      data-variant={variant}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-4 @3xl:px-8">
        <Logotype variant="brand-ai-chat" />
        <nav aria-label="AI Chat" className="flex items-center gap-1">
          <ButtonsArray variant="navbar-ai-chat" id="ai-chat-try" />
          {subjectAccount}
        </nav>
      </div>
    </header>
  );
}
