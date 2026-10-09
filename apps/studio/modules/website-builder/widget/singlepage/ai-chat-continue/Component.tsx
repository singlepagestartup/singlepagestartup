import { Component as WebsiteBuilderModuleButtonsArray } from "../../../buttons-array";
import { Icon } from "../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import type { IWebsiteSection } from "../../../../../workspace/utils/products/ai-chat-content";
import defaultContent from "./content.json";

export interface IAIChatContinueProps {
  content?: {
    continue: IWebsiteSection;
    terms: IWebsiteSection;
    startLink: { text: string; href: string };
  };
}
const display = "font-sps font-semibold tracking-normal";
const muted = "text-sps-muted";
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sps-green";
const section = "mx-auto max-w-6xl px-5 @3xl:px-8";
export function Component({
  content = defaultContent,
}: IAIChatContinueProps = {}) {
  const mainLink = content.startLink;
  return (
    <section
      data-ds-block="website-builder.widget.ai-chat-continue"
      className={`${section} pb-10`}
    >
      <div className="flex flex-wrap items-center justify-between gap-6 border-t border-sps-line py-8">
        <div className="max-w-xl">
          <h2 className={`text-2xl ${display}`}>{content.continue.title}</h2>
          <p className={`mt-3 text-base leading-7 ${muted}`}>
            {content.continue.paragraphs[0]}
          </p>
        </div>
        <WebsiteBuilderModuleButtonsArray
          variant="default"
          buttons={[
            { label: mainLink.text, href: mainLink.href, variant: "primary" },
          ]}
        />
      </div>
      <details className="group border-t border-sps-line">
        <summary
          className={`flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 py-5 text-sm font-semibold [&::-webkit-details-marker]:hidden ${focus}`}
        >
          {content.terms.title}
          <Icon
            name="caret-down"
            className="shrink-0 transition-transform group-open:rotate-180"
          />
        </summary>
        <div className="pb-7">
          <p className={`max-w-3xl text-sm leading-6 ${muted}`}>
            {content.terms.paragraphs[0]}
          </p>
          <dl className="mt-5 grid gap-5 @3xl:grid-cols-2">
            {content.terms.items.map((item) => (
              <div key={item.title}>
                <dt className="text-sm font-semibold">{item.title}</dt>
                <dd className={`mt-2 text-sm leading-6 ${muted}`}>
                  {item.text}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-5">
            <WebsiteBuilderModuleButtonsArray
              variant="default"
              buttons={content.terms.links.map((link) => ({
                label: link.text,
                href: link.href,
                variant: "link",
              }))}
            />
          </div>
        </div>
      </details>
    </section>
  );
}
