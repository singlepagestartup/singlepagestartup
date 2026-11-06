import type { IComponentProps, IAIChatFooterProps } from "./interface";
export type { IAIChatFooterProps } from "./interface";
import { Component as Logotype } from "../../../../logotype/index";
import { Component as ButtonsArray } from "../../../../buttons-array/index";
import type { IWebsiteSection } from "../../content/ai-chat/content";
import defaultContent from "./content.json";

export function Component({
  variant = "footer-ai-chat",
  content = defaultContent,
  className = "mx-auto w-full max-w-6xl px-5 @3xl:px-8",
}: IComponentProps = {}) {
  return (
    <footer
      data-ds-block="website-builder.widget.footer-ai-chat"
      className={className}
      data-module="website-builder"
      data-model="widget"
      data-variant={variant}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 border-t border-border py-7">
        <Logotype variant="brand-ai-chat" />
        <ButtonsArray
          variant="default"
          ariaLabel="Ссылки AI Chat"
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
