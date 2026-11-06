import type {
  IComponentProps,
  FooterDefaultProps,
  IFooterColumn,
  IFooterLink,
} from "./interface";
export type { FooterDefaultProps } from "./interface";
import {
  Component as ButtonsArray,
  type ButtonsArrayItem,
} from "../../../buttons-array/index";

import { Component as Logotype } from "../../../logotype/index";

const repository = "https://github.com/singlepagestartup/singlepagestartup";
const storyLink = (label: string, story: string): IFooterLink => ({
  label,
  href: `/?path=/story/modules-host-models-page-singlepage-${story}--default`,
  target: "_top",
});

export const defaultFooterDefaultProps: FooterDefaultProps = {
  brand: "SinglePageStartup",
  description:
    "Prepare your business materials in AI Chat. Build your product with the free Code Framework.",
  copyright: "© 2026 SinglePageStartup",
  columns: [
    {
      title: "Build",
      links: [
        storyLink("Code Framework", "framework"),
        storyLink("Modules", "framework-module-find"),
        { label: "Get the code", href: repository, target: "_top" },
      ],
    },
    {
      title: "Prepare",
      links: [
        storyLink("AI Chat", "ai-chat"),
        storyLink("Plans and tokens", "ecommerce-module-token-find"),
        storyLink("Help", "ai-chat-help"),
      ],
    },
    {
      title: "Learn",
      links: [
        storyLink("Blog", "blog-module-article-find"),
        {
          label: "Documentation",
          href: `${repository}/blob/main/README.md`,
          target: "_top",
        },
        {
          label: "Report an issue",
          href: `${repository}/issues`,
          target: "_top",
        },
      ],
    },
  ] satisfies IFooterColumn[],
  legalLinks: [
    storyLink("Privacy", "privacy"),
    storyLink("Terms", "terms"),
    {
      label: "MIT License",
      href: `${repository}/blob/main/LICENSE`,
      target: "_top",
    },
  ],
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
          ...link,
          variant: "link",
        }) satisfies ButtonsArrayItem,
    ),
  }));
  const legalButtons = legalLinks.map(
    (link) =>
      ({
        ...link,
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
        <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
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
