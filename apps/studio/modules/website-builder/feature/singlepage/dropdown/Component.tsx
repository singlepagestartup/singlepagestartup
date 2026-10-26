import type { IComponentProps, FeatureDropdownProps } from "./interface";
export type { FeatureDropdownProps } from "./interface";
import { Component as SharedIcon } from "../../../../shared/icon";
import { forwardRef, type SVGProps } from "react";
import { twMerge as twMerge } from "tailwind-merge";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
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

export function FeatureDropdown(props?: IComponentProps) {
  const { question, answer, open } = {
    ...defaultFeatureDropdownProps,
    ...props,
  };
  if (props?.appearance === "document")
    return (
      <details
        open={open}
        className={`group w-full min-w-0 rounded-xl ${props.tone === "dark" ? "bg-default-foreground/5" : "bg-muted"}`}
        data-module="website-builder"
        data-model="feature"
        data-variant="dropdown"
        data-ds-block="website-builder.feature.dropdown"
      >
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl px-3 py-2 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
          <SharedIcon variant="phosphor" name="file-text" size={20} />
          <span className="flex-1">{question}</span>
          <SharedIcon variant="phosphor" name="question" size={20} />
        </summary>
        <div
          className={`border-t px-3 pb-4 pt-3 text-xs leading-6 ${props.tone === "dark" ? "border-default-foreground/10 text-default-muted-foreground" : "border-border text-muted-foreground"}`}
        >
          <p>{answer}</p>
          {props.example ? (
            <p className="mt-3 rounded-lg bg-card/10 p-3">
              <span className="block text-[10px] font-semibold uppercase tracking-wider">
                {props.exampleLabel}
              </span>
              {props.example}
            </p>
          ) : null}
        </div>
      </details>
    );
  if (props?.appearance === "card")
    return (
      <details
        open={open}
        className="group mb-3 rounded-2xl border border-border bg-card open:border-primary/50 open:bg-primary/10"
        data-module="website-builder"
        data-model="feature"
        data-variant="dropdown"
        data-ds-block="website-builder.feature.dropdown"
      >
        <summary className="flex min-h-[76px] cursor-pointer list-none items-center justify-between gap-4 rounded-2xl p-4 text-sm font-semibold leading-6 hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground [&::-webkit-details-marker]:hidden">
          <span>{question}</span>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground group-open:bg-default group-open:text-primary">
            <SharedIcon
              variant="phosphor"
              name="plus"
              size={20}
              className="group-open:hidden"
            />
            <SharedIcon
              variant="phosphor"
              name="minus"
              size={20}
              className="hidden group-open:block"
            />
          </span>
        </summary>
        <div className="px-4 pb-5 text-sm leading-7 text-muted-foreground">
          {answer}
        </div>
      </details>
    );
  return (
    <details
      className="group min-w-0 border-b border-border last:border-0"
      open={open}
      data-ds-block="website-builder.feature.dropdown"
      data-ds-layer="singlepage"
      data-module="website-builder"
      data-model="feature"
      data-variant={props?.variant ?? "dropdown"}
    >
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-5 py-5 text-base font-semibold leading-6 text-foreground transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground [&::-webkit-details-marker]:hidden">
        <span>{question}</span>
        <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none group-open:rotate-180" />
      </summary>
      <p className="px-5 pb-6 pr-12 text-base leading-7 text-muted-foreground">
        {answer}
      </p>
    </details>
  );
}
const ChevronDown = createIcon("caret-down");
export const defaultFeatureDropdownProps = {
  question: "What tech stack do you use?",
  answer:
    "We primarily use React / Next.js with Tailwind CSS, but we adapt to your existing stack if needed — Vue, Nuxt, Astro, or plain HTML/CSS.",
  open: true,
};
