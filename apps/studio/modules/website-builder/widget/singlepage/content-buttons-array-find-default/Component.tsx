import type {
  IComponentProps,
  ContentButtonsArrayFindDefaultProps,
} from "./interface";
export type { ContentButtonsArrayFindDefaultProps } from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import { forwardRef, type SVGProps } from "react";
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

interface IntegrationItem {
  label: string;
  icon: ModuleIcon;
}

export function ContentButtonsArrayFindDefault(props?: IComponentProps) {
  const { label, integrations } = {
    ...defaultContentButtonsArrayFindDefaultProps,
    ...props,
  };
  return (
    <div
      className="w-full bg-muted py-6 sm:py-8"
      data-ds-block="website-builder.widget.content-buttons-array-find-default"
      data-ds-layer="singlepage"
      data-module="website-builder"
      data-model="widget"
      data-variant={props?.variant ?? "content-buttons-array-find-default"}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-col gap-6 rounded-2xl border border-border bg-card p-6 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-base font-semibold leading-7 text-foreground">
            {label}
          </p>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {integrations.map((integration) => (
              <span
                className="inline-flex max-w-full items-center gap-2 rounded-xl bg-muted px-3 py-3 text-sm text-foreground"
                key={integration.label}
              >
                <integration.icon className="h-5 w-5 shrink-0" />
                {integration.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
const Zap = createIcon("lightning");
const Mail = createIcon("envelope");
const Lock = createIcon("lock-key");
const Globe = createIcon("globe");
const Database = createIcon("database");
const Code = createIcon("code");
export const defaultContentButtonsArrayFindDefaultProps = {
  label: "Works with your existing stack:",
  integrations: [
    { icon: Code, label: "REST API" },
    { icon: Database, label: "PostgreSQL" },
    { icon: Zap, label: "Webhooks" },
    { icon: Globe, label: "CDN" },
    { icon: Lock, label: "OAuth 2.0" },
    { icon: Mail, label: "SMTP" },
  ] satisfies IntegrationItem[],
};

import type { IModuleIconProps } from "./interface";
