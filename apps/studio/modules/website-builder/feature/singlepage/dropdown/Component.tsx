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
