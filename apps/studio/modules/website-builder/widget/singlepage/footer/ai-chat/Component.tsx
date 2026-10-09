import { Component as WebsiteBuilderModuleLogotype } from "../../../../logotype";
import { Component as WebsiteBuilderModuleButtonsArray } from "../../../../buttons-array";
import type { IWebsiteSection } from "../../../../../../workspace/utils/products/ai-chat-content";
import defaultContent from "./content.json";

export interface IAIChatFooterProps {
  content?: IWebsiteSection;
}
export function Component({
  content = defaultContent,
}: IAIChatFooterProps = {}) {
  return (
    <footer
      data-ds-block="website-builder.widget.footer-ai-chat"
      className="mx-auto w-full max-w-6xl px-5 @3xl:px-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-5 border-t border-sps-line py-7">
        <WebsiteBuilderModuleLogotype variant="brand-ai-chat" />
        <WebsiteBuilderModuleButtonsArray
          variant="default"
          ariaLabel="AI Chat footer"
          buttons={content.links.map((link) => ({
            label: link.text,
            href: link.href,
            variant: "link",
          }))}
        />
      </div>
    </footer>
  );
}
