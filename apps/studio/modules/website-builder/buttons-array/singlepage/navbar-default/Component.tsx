import { Component as WebsiteBuilderModuleButton } from "../../../button";

export interface INavbarButtonsProps {
  activeHref?: string;
  orientation?: "horizontal" | "vertical";
  onNavigate?: () => void;
}
const links = [
  { label: "Home", href: "/", story: "root" },
  {
    label: "Services",
    href: "/ecommerce/products",
    story: "ecommerce-products",
  },
  { label: "Blog", href: "/blog", story: "blog" },
  { label: "Chat", href: "/chat", disabled: true },
];
export function Component({
  activeHref = "/",
  orientation = "horizontal",
  onNavigate,
}: INavbarButtonsProps = {}) {
  return (
    <nav
      aria-label="Primary"
      data-ds-block="website-builder.buttons-array.navbar-default"
      className={`flex min-w-0 gap-1 ${orientation === "vertical" ? "flex-col" : "items-center"}`}
    >
      {links.map((link) => (
        <WebsiteBuilderModuleButton
          key={link.href}
          variant="navigation"
          label={link.label}
          href={
            link.story
              ? `/?path=/story/modules-host-models-page-singlepage-${link.story}--default`
              : link.href
          }
          target={link.story ? "_top" : undefined}
          disabled={link.disabled}
          selected={link.href === activeHref}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}
