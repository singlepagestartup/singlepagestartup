import type { IComponentProps, IAIChatContinueProps } from "./interface";
export type { IAIChatContinueProps } from "./interface";

import { Component as SharedIcon } from "../../../../../../shared/icon";

import type IconGlyphs from "../../../../../../shared/icon/singlepage/phosphor/icons.json";
import { Component as ButtonsArray } from "../../../../../buttons-array/index";
import type { IWebsiteSection } from "../content";
import defaultContent from "./content.json";
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

export function Component({
  variant = "content-ai-chat-continue",
  content = defaultContent,
}: IComponentProps = {}) {
  const mainLink = content.startLink;
  return (
    <section
      data-ds-block="website-builder.widget.content-ai-chat-continue"
      className={`${section} pb-10`}
      data-module="website-builder"
      data-model="widget"
      data-variant={variant}
    >
      <div className="flex flex-wrap items-center justify-between gap-6 border-t border-border py-8">
        <div className="max-w-xl">
          <h2 className={`text-2xl ${display}`}>{content.continue.title}</h2>
          <p className={`mt-3 text-base leading-7 ${muted}`}>
            {content.continue.paragraphs[0]}
          </p>
        </div>
        <ButtonsArray
          variant="default"
          buttons={[
            { label: mainLink.text, href: mainLink.href, variant: "primary" },
          ]}
        />
      </div>
      <details className="group border-t border-border">
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
            <ButtonsArray
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
const display = "font-default font-semibold tracking-normal";
const muted = "text-muted-foreground";
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary";
const section = "mx-auto max-w-6xl px-5 @3xl:px-8";
