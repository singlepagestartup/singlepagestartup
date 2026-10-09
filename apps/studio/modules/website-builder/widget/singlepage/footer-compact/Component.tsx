import {
  Component as WebsiteBuilderModuleButtonsArray,
  type ButtonsArrayItem,
} from "../../../buttons-array";

import { Component as WebsiteBuilderModuleLogotype } from "../../../logotype";

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

export type FooterCompactProps = typeof defaultFooterCompactProps;

export function FooterCompact(props?: Partial<FooterCompactProps>) {
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
      className="w-full border-t border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)]"
      data-ds-block="website-builder.widget.footer-compact"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-start justify-between gap-4 py-8 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-3 text-sm leading-6 text-[var(--workspace-brand-muted)]">
          <WebsiteBuilderModuleLogotype variant="default" compact />
          <span>{copyright}</span>
        </div>
        <WebsiteBuilderModuleButtonsArray
          variant="default"
          ariaLabel="Utility"
          buttons={utilityButtons}
        />
      </div>
    </footer>
  );
}
