import type { IComponentProps, FooterCompactProps } from "./interface";
export type { FooterCompactProps } from "./interface";
import {
  Component as ButtonsArray,
  type ButtonsArrayItem,
} from "../../../buttons-array/index";

import { Component as Logotype } from "../../../logotype/index";

interface StudioLink {
  label: string;
  href: string;
}

export const defaultFooterCompactProps = {
  brand: "SinglePageStartup",
  copyright: "© 2026 SinglePageStartup",
  links: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Services", href: "/ecommerce/products" },
    { label: "Blog", href: "/blog" },
  ] satisfies StudioLink[],
};

export function FooterCompact(props?: IComponentProps) {
  const { copyright, links } = { ...defaultFooterCompactProps, ...props };
  const utilityButtons = links.map(
    (link) =>
      ({
        ...link,
        variant: "link",
      }) satisfies ButtonsArrayItem,
  );

  return (
    <footer
      className="w-full border-t border-border bg-card"
      data-ds-block="website-builder.widget.footer-compact"
      data-ds-layer="singlepage"
      data-module="website-builder"
      data-model="widget"
      data-variant={props?.variant ?? "footer-compact"}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-start justify-between gap-4 py-8 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-3 text-sm leading-6 text-muted-foreground">
          <Logotype variant="default" compact />
          <span>{copyright}</span>
        </div>
        <ButtonsArray
          variant="default"
          ariaLabel="Utility"
          buttons={utilityButtons}
        />
      </div>
    </footer>
  );
}
