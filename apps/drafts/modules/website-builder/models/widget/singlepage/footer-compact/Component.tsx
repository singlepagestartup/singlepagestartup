import {
  ButtonsArrayDefault,
  type ButtonsArrayItem,
} from "../../../buttons-array/singlepage/default/Component";

const brandMarkSrc = new URL("./assets/singlepagestartup.svg", import.meta.url)
  .href;

interface DraftLink {
  label: string;
  href: string;
}

function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "h-6 w-6 rounded" : "h-8 w-8 rounded-lg";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden bg-slate-900 ${sizeClass}`}
      aria-hidden="true"
    >
      <img className="h-full w-full object-contain" src={brandMarkSrc} alt="" />
    </span>
  );
}

export const defaultFooterCompactProps = {
  brand: "SinglePageStartup",
  copyright: "© 2026 SinglePageStartup",
  links: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Services", href: "/services" },
    { label: "Blog", href: "/blog" },
    { label: "Admin", href: "/admin" },
  ] satisfies DraftLink[],
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
    <div
      className="w-full border-t border-slate-200 bg-white"
      data-ds-block="website-builder.widget.footer-compact"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-6xl px-6 flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <BrandMark size="sm" />
          <span>{copyright}</span>
        </div>
        <ButtonsArrayDefault ariaLabel="Utility" buttons={utilityButtons} />
      </div>
    </div>
  );
}
