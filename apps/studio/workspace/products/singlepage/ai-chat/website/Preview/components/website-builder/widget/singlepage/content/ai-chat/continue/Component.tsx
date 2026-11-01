import IconGlyphs from "../../../../../feature/singlepage/icon/icons.json";
import { Component as WebsiteBuilderModuleButtonsArray } from "../../../../../buttons-array/index";
import type { IWebsiteSection } from "../content";
import defaultContent from "./content.json";
function Icon({
  name,
  size = 20,
  className = "",
  svgProps,
}: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  const geometry = IconGlyphs[name]
    ?.replace(/^\s*<svg\b[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");
  if (!geometry) throw new Error("Нет иконки Phosphor:" + name);
  return (
    <svg
      className={`shrink-0 ${size === 24 ? "size-6" : "size-5"} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="currentColor"
      data-icon-family="phosphor"
      data-icon-name={name}
      data-icon-weight="regular"
      aria-hidden="true"
      focusable="false"
      {...svgProps}
      dangerouslySetInnerHTML={{ __html: geometry }}
    />
  );
}
export interface IAIChatContinueProps {
  content?: {
    continue: IWebsiteSection;
    terms: IWebsiteSection;
    startLink: {
      text: string;
      href: string;
    };
  };
}
export function Component({
  content = defaultContent,
}: IAIChatContinueProps = {}) {
  const mainLink = content.startLink;
  return (
    <section
      data-ds-block="website-builder.widget.content-ai-chat-continue"
      className={`${section} pb-10`}
    >
      <details
        open
        className="group border-t border-[color:var(--workspace-brand-line)]"
      >
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
      <div className="flex flex-wrap items-center justify-between gap-6 border-t border-[color:var(--workspace-brand-line)] py-8">
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
    </section>
  );
}
const display =
  "font-[family-name:var(--workspace-brand-font-body)] font-semibold tracking-normal";
const muted = "text-[color:var(--workspace-brand-muted)]";
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--workspace-brand-accent)]";
const section = "mx-auto max-w-6xl px-5 @3xl:px-8";
