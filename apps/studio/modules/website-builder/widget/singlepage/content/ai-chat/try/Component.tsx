import type { IComponentProps, IAIChatTryProps } from "./interface";
export type { IAIChatTryProps } from "./interface";
import type { ReactNode } from "react";
import type { IWebsiteSection } from "../content";
import defaultContent from "./content.json";

export function Component({
  variant = "content-ai-chat-try",
  content = defaultContent,
  children,
}: IComponentProps = {}) {
  return (
    <section
      id="workflow"
      data-ds-block="website-builder.widget.content-ai-chat-try"
      className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-10 pt-8 @3xl:px-8 @3xl:pb-14"
      data-module="website-builder"
      data-model="widget"
      data-variant={variant}
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <h2 className="font-default text-3xl font-semibold leading-tight tracking-normal">
            {content.workflow.title}
          </h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            {content.workflow.paragraphs[0]}
          </p>
        </div>
        <p className="max-w-xs text-xs leading-5 text-muted-foreground">
          {content.uploadNote}
        </p>
      </div>
      {children}
    </section>
  );
}
