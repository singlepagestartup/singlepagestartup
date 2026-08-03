import {
  ButtonsArrayDefault,
  type ButtonsArrayItem,
} from "../../../buttons-array/singlepage/default/Component";

const brandLockupSrc = new URL(
  "./assets/singlepagestartup-logo.svg",
  import.meta.url,
).href;

interface FooterColumn {
  title: string;
  links: string[];
}

function BrandLockup() {
  return (
    <span
      className="inline-flex h-8 w-32 items-center overflow-hidden"
      aria-hidden="true"
    >
      <img
        className="h-full w-auto object-contain"
        src={brandLockupSrc}
        alt=""
      />
    </span>
  );
}

export const defaultFooterDefaultProps = {
  brand: "SPS",
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

export type FooterDefaultProps = typeof defaultFooterDefaultProps;

export function FooterDefault(props?: Partial<FooterDefaultProps>) {
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
    <div
      className="w-full border-t border-slate-200 bg-white"
      data-ds-block="website-builder.widget.footer-default"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <a
              className="inline-flex items-center no-underline"
              href="/"
              aria-label={brand}
            >
              <BrandLockup />
            </a>
            <p className="mt-3 text-sm text-slate-500">{description}</p>
          </div>
          {columnGroups.map((column) => (
            <ButtonsArrayDefault
              ariaLabel={column.title}
              buttons={column.buttons}
              key={column.title}
              orientation="vertical"
              title={column.title}
            />
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row">
          <p className="text-xs text-slate-400">{copyright}</p>
          <ButtonsArrayDefault ariaLabel="Legal" buttons={legalButtons} />
        </div>
      </div>
    </div>
  );
}
