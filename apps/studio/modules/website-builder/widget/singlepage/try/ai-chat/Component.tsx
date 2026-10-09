import type { ReactNode } from "react";
import type { IWebsiteSection } from "../../../../../../workspace/utils/products/ai-chat-content";
import defaultContent from "./content.json";

export interface IAIChatTryProps {
  content?: { workflow: IWebsiteSection; uploadNote: string };
  children?: ReactNode;
}
export function Component({
  content = defaultContent,
  children,
}: IAIChatTryProps = {}) {
  return (
    <section
      id="workflow"
      data-ds-block="website-builder.widget.try-ai-chat"
      className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-10 pt-8 @3xl:px-8 @3xl:pb-14"
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <h2 className="font-sps text-3xl font-semibold leading-tight tracking-normal">
            {content.workflow.title}
          </h2>
          <p className="mt-3 text-base leading-7 text-sps-muted">
            {content.workflow.paragraphs[0]}
          </p>
        </div>
        <p className="max-w-xs text-xs leading-5 text-sps-muted">
          {content.uploadNote}
        </p>
      </div>
      {children}
    </section>
  );
}
