import type { IComponentProps, FooterDefaultProps } from "./interface";
export type { FooterDefaultProps } from "./interface";
import {
  Component as ButtonsArray,
  type ButtonsArrayItem,
} from "../../../buttons-array/index";

import { Component as Logotype } from "../../../logotype/index";

interface FooterColumn {
  title: string;
  links: string[];
}

export const defaultFooterDefaultProps = {
  brand: "SinglePageStartup",
  description: "Modular platform for building digital ecosystems.",
  copyright: "© 2026 SinglePageStartup. All rights reserved.",
  columns: [
    {
      title: "Product",
      links: ["Features", "Modules", "Pricing", "Changelog", "Roadmap"],
    },
    {
      title: "Resources",
      links: ["Documentation", "API Reference", "Guides", "Blog", "Community"],
    },
    {
      title: "Company",
      links: ["About", "Careers", "Press", "Partners", "Contact"],
    },
    {
      title: "Legal",
      links: ["Privacy", "Terms", "Cookies", "License", "Security"],
    },
  ] satisfies FooterColumn[],
  legalLinks: ["Privacy", "Terms", "Cookies"],
};

export function FooterDefault(props?: IComponentProps) {
  const { brand, description, copyright, columns, legalLinks } = {
    ...defaultFooterDefaultProps,
    ...props,
  };
  const columnGroups = columns.map((column) => ({
    title: column.title,
    buttons: column.links.map(
      (link) =>
        ({
          label: link,
          href: "#",
          variant: "link",
        }) satisfies ButtonsArrayItem,
    ),
  }));
  const legalButtons = legalLinks.map(
    (link) =>
      ({
        label: link,
        href: "#",
        size: "xs",
        tone: "muted",
        variant: "link",
      }) satisfies ButtonsArrayItem,
  );

  return (
    <footer
      className="w-full border-t border-border bg-card"
      data-ds-block="website-builder.widget.footer-default"
      data-ds-layer="singlepage"
      data-module="website-builder"
      data-model="widget"
      data-variant={props?.variant ?? "footer-default"}
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-5">
          <div className="min-w-0 sm:col-span-2 lg:col-span-1">
            <Logotype variant="default" brand={brand} />
            <p className="mt-5 max-w-xs text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
          {columnGroups.map((column) => (
            <ButtonsArray
              variant="default"
              ariaLabel={column.title}
              buttons={column.buttons}
              key={column.title}
              orientation="vertical"
              title={column.title}
            />
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="text-xs leading-5 text-muted-foreground">{copyright}</p>
          <ButtonsArray
            variant="default"
            ariaLabel="Legal"
            buttons={legalButtons}
          />
        </div>
      </div>
    </footer>
  );
}
