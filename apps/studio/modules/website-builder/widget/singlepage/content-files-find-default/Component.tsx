import type {
  IComponentProps,
  ContentFilesFindDefaultProps,
} from "./interface";
export type { ContentFilesFindDefaultProps } from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";
import { forwardRef, type SVGProps } from "react";
import { twMerge as twMerge } from "tailwind-merge";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
import {
  Component as Feature,
  type FeatureListItemDefaultProps,
} from "../../../feature/index";

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

type FeatureListItem = Pick<FeatureListItemDefaultProps, "label" | "icon">;

export function ContentFilesFindDefault(props?: IComponentProps) {
  const { eyebrow, title, paragraphs, mediaSrc, mediaAlt, features } = {
    ...defaultContentFilesFindDefaultProps,
    ...props,
  };
  return (
    <div
      className="w-full bg-muted py-12 sm:py-16"
      data-ds-block="website-builder.widget.content-files-find-default"
      data-ds-layer="singlepage"
      data-module="website-builder"
      data-model="widget"
      data-variant={props?.variant ?? "content-files-find-default"}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-3xl bg-card lg:grid-cols-2">
          <div className="relative aspect-square min-w-0 lg:aspect-auto">
            <img
              className="absolute inset-0 h-full w-full object-cover"
              src={mediaSrc}
              alt={mediaAlt}
            />
          </div>
          <div className="min-w-0 p-6 sm:p-8 lg:p-10">
            <p className="mb-2 text-sm font-semibold tracking-normal text-muted-foreground">
              {eyebrow}
            </p>
            <h2 className="text-[2rem] font-semibold leading-tight tracking-normal sm:text-[2.5rem] text-foreground">
              {title}
            </h2>
            {paragraphs.map((paragraph, index) => (
              <p
                className={`text-base leading-7 text-muted-foreground ${index === 0 ? "mt-4" : "mt-3"}`}
                key={paragraph}
              >
                {paragraph}
              </p>
            ))}
            <div
              className="mt-8 grid gap-4 sm:grid-cols-2"
              data-ds-imports="website-builder.feature.list-item-default"
            >
              {features.map((item) => (
                <Feature
                  key={item.label}
                  {...item}
                  variant="list-item-default"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
const Layers = createIcon("stack");
const Globe = createIcon("globe");
const FileText = createIcon("file-text");
const Database = createIcon("database");
const aboutImageUrl =
  "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-work-in-motion-square.png";
export const defaultContentFilesFindDefaultProps = {
  eyebrow: "About the platform",
  title: "Built for builders",
  paragraphs: [
    "We started with a simple idea: what if every common backend feature - ecommerce, CRM, blog, notifications, RBAC - was a pre-built module you could drop into any project?",
    "The result is a platform with 15 composable modules, 50+ entity models, and a powerful admin panel that gives your team full control over every data point.",
  ],
  mediaSrc: aboutImageUrl,
  mediaAlt: "Editorial image of a person handing over a parcel",
  features: [
    { label: "Modular architecture", icon: Layers },
    { label: "Relation system", icon: Database },
    { label: "Localized content", icon: Globe },
    { label: "Rich-text editor", icon: FileText },
  ] satisfies FeatureListItem[],
};

import type { IModuleIconProps } from "./interface";
