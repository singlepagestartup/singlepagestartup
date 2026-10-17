import type { IComponentProps, ContentFeatureFindRowProps } from "./interface";
export type { ContentFeatureFindRowProps } from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import { forwardRef, type SVGProps, type ReactNode } from "react";
import { twMerge as twMerge } from "tailwind-merge";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
type ModuleIcon = ReturnType<typeof createIcon>;

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

interface ContactItem {
  label: string;
  icon: ModuleIcon;
}

export function ContentFeatureFindRow(props?: IComponentProps) {
  const { eyebrow, title, description, contacts, contactForm } = {
    ...defaultContentFeatureFindRowProps,
    ...props,
  };
  return (
    <div
      id="contact"
      className="w-full bg-muted py-12 sm:py-16"
      data-ds-block="website-builder.widget.content-feature-find-row"
      data-ds-imports="rbac.subject.me-crm-module-form-default"
      data-ds-layer="singlepage"
      data-module="website-builder"
      data-model="widget"
      data-variant={props?.variant ?? "content-feature-find-row"}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-3xl border border-border bg-card lg:grid-cols-2">
          <div className="min-w-0 bg-default p-6 sm:p-10">
            <p className="mb-3 text-sm font-semibold tracking-normal text-default-muted-foreground">
              {eyebrow}
            </p>
            <h2 className="text-[2rem] font-semibold leading-tight tracking-normal text-default-foreground sm:text-[2.5rem]">
              {title}
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-default-muted-foreground">
              {description}
            </p>
            <div className="mt-8 space-y-4">
              {contacts.map((contact) => (
                <span
                  className="flex min-w-0 items-center gap-3 text-base leading-7 text-default-muted-foreground"
                  key={contact.label}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-card text-foreground">
                    <contact.icon className="h-5 w-5 shrink-0" />
                  </span>
                  <span className="min-w-0 break-words">{contact.label}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="min-w-0 p-6 sm:p-10">{contactForm}</div>
        </div>
      </div>
    </div>
  );
}
const Phone = createIcon("phone");
const MapPin = createIcon("map-pin");
const Mail = createIcon("envelope");
export const defaultContentFeatureFindRowProps = {
  eyebrow: "Get in touch",
  title: "Contact us",
  description:
    "Have questions about the platform? Want a demo? Reach out and we'll get back to you within 24 hours.",
  contacts: [
    { icon: Mail, label: "hello@sps.dev" },
    { icon: Phone, label: "+1 (555) 123-4567" },
    { icon: MapPin, label: "San Francisco, CA" },
  ] satisfies ContactItem[],
};

import type { IModuleIconProps } from "./interface";
