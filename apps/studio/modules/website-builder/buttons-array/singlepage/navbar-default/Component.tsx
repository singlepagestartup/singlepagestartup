import type { IComponentProps, INavbarButtonsProps } from "./interface";
export type { INavbarButtonsProps } from "./interface";
import { Component as Button } from "../../../button/index";

const links = [
  { label: "Home", href: "/", story: "root" },
  {
    label: "Services",
    href: "/ecommerce/products",
    story: "ecommerce-module-product-find",
  },
  { label: "Blog", href: "/blog", story: "blog-module-article-find" },
  { label: "Chat", href: "/chat", disabled: true },
];
export function Component({
  variant = "navbar-default",
  activeHref = "/",
  orientation = "horizontal",
  onNavigate,
}: IComponentProps = {}) {
  return (
    <nav
      aria-label="Primary"
      data-ds-block="website-builder.buttons-array.navbar-default"
      className={`flex min-w-0 gap-1 ${orientation === "vertical" ? "flex-col" : "items-center"}`}
      data-module="website-builder"
      data-model="buttons-array"
      data-variant={variant}
    >
      {links.map((link) => (
        <Button
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
