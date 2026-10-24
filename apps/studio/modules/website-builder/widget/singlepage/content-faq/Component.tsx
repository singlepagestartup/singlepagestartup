import type {
  IComponentProps,
  ContentFaqItem,
  ContentFaqProps,
} from "./interface";
export type { ContentFaqItem, ContentFaqProps } from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";
import { Component as Feature } from "../../../feature/index";
import { forwardRef, type SVGProps } from "react";
import { twMerge as twMerge } from "tailwind-merge";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
import { Component as ButtonsArray } from "../../../buttons-array/index";
interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
type IconName = keyof typeof IconGlyphs;
function createIcon(name: IconName) {
  const Component = forwardRef<SVGSVGElement, IModuleIconProps>(
    function ModuleGlyph({ className, size = 20, children, ...props }, ref) {
      return (
        <span className="contents">
          <Icon
            name={name}
            className={twMerge("h-5 w-5", className)}
            svgProps={{ ...props, ref, width: size, height: size }}
          />
        </span>
      );
    },
  );
  Component.displayName = `Phosphor(${name})`;
  return Component;
}
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

export function ContentFaq(props?: IComponentProps) {
  const { eyebrow, title, description, contactHref, faq } = {
    ...defaultContentFaqProps,
    ...props,
  };
  return (
    <section
      className="w-full bg-background py-12 @3xl:py-16"
      data-ds-block="website-builder.widget.content-faq"
      data-ds-layer="singlepage"
      data-module="website-builder"
      data-model="widget"
      data-variant={props?.variant ?? "content-faq"}
    >
      <div className="mx-auto w-full max-w-7xl px-5 @3xl:px-8">
        <div className="grid gap-8 @3xl:grid-cols-[0.9fr_1.1fr] @3xl:gap-12">
          <div>
            {props?.aside ?? (
              <div className="rounded-3xl border border-border bg-muted p-6 @3xl:p-8">
                <p className="mb-2 text-sm font-semibold tracking-normal text-muted-foreground">
                  {eyebrow}
                </p>
                <h2 className="text-[2rem] font-semibold leading-tight tracking-normal sm:text-[2.5rem] text-foreground">
                  {title}
                </h2>
                <div className="mt-4 max-w-md space-y-4 text-base leading-7 text-muted-foreground">
                  {description}
                </div>
                <div className="mt-5">
                  {props?.actions ?? (
                    <ButtonsArray
                      variant="default"
                      ariaLabel="FAQ contact actions"
                      buttons={[
                        {
                          href: contactHref,
                          icon: ArrowRight,
                          label: "Contact us",
                          variant: "secondary",
                        },
                      ]}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="min-w-0 self-start">
            {props?.questionsTitle ? (
              <h2 className="mb-6 font-default text-3xl font-semibold leading-tight tracking-normal text-foreground @4xl:text-4xl">
                {props.questionsTitle}
              </h2>
            ) : null}
            <div
              className="min-w-0 self-start rounded-2xl border border-border bg-card p-2"
              data-ds-imports="website-builder.feature.dropdown"
            >
              {props?.children ??
                faq.map((item, idx) => (
                  <Feature
                    variant="dropdown"
                    key={item.q}
                    question={item.q}
                    answer={item.a}
                    open={idx === 0}
                  />
                ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
const ArrowRight = createIcon("arrow-right");
export const defaultContentFaqProps = {
  eyebrow: "FAQ",
  title: "Frequently asked questions",
  description:
    "Can't find the answer you're looking for? Reach out to our team and we'll get back to you within 24 hours.",
  contactHref: "/#contact",
  faq: [
    {
      q: "What tech stack do you use?",
      a: "We primarily use React / Next.js with Tailwind CSS, but we adapt to your existing stack if needed — Vue, Nuxt, Astro, or plain HTML/CSS.",
    },
    {
      q: "How long does a typical project take?",
      a: "A standard marketing website takes 4-6 weeks. Complex portals with CMS and integrations can take 8-12 weeks.",
    },
    {
      q: "Do you provide hosting?",
      a: "We recommend and set up hosting on Vercel, Netlify, or your preferred cloud provider. Hosting costs are separate.",
    },
    {
      q: "What about ongoing maintenance?",
      a: "We offer monthly maintenance packages starting at $299/mo covering updates, backups, and minor changes.",
    },
  ] satisfies ContentFaqItem[],
};
