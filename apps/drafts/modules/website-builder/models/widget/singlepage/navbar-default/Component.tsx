import { type ReactNode, useState } from "react";

import { LogIn, Menu, Shield, ShoppingCart, X } from "lucide-react";

const brandMarkSrc = new URL("./assets/singlepagestartup.svg", import.meta.url)
  .href;

interface DraftLink {
  label: string;
  href: string;
  storyHref?: string;
  disabled?: boolean;
}

const hostStoryHref = (storyId: string) => `/?path=/story/${storyId}`;

const hostStoryHrefs = {
  adminSettings: hostStoryHref(
    "modules-host-models-page-singlepage-admin-settings--default",
  ),
  blog: hostStoryHref(
    "modules-host-models-page-singlepage-blog-find-article-card--default",
  ),
  cart: hostStoryHref(
    "modules-host-models-page-singlepage-ecommerce-cart-flow-default--default",
  ),
  home: hostStoryHref(
    "modules-host-models-page-singlepage-home-default--default",
  ),
  services: hostStoryHref(
    "modules-host-models-page-singlepage-ecommerce-product-find-card--default",
  ),
};

function getStoryLinkProps(href: string, storyHref?: string) {
  if (storyHref) {
    return {
      href: storyHref,
      target: "_top" as const,
    };
  }

  return { href };
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

export const defaultNavbarDefaultProps = {
  brand: "SinglePageStartup",
  activeHref: "/",
  brandHref: "/",
  brandStoryHref: hostStoryHrefs.home,
  cartCount: 0,
  cartHref: "/cart",
  cartStoryHref: hostStoryHrefs.cart,
  links: [
    { label: "Home", href: "/", storyHref: hostStoryHrefs.home },
    {
      label: "Services",
      href: "/ecommerce/products",
      storyHref: hostStoryHrefs.services,
    },
    { label: "Blog", href: "/blog", storyHref: hostStoryHrefs.blog },
    { label: "Chat", href: "/chat", disabled: true },
  ] satisfies DraftLink[],
  adminHref: "/admin/settings",
  adminStoryHref: hostStoryHrefs.adminSettings,
  loginHref: "/rbac/subject/authentication/select-method",
  loginStoryHref: undefined,
};

export interface NavbarDefaultProps {
  brand: string;
  activeHref: string;
  brandHref: string;
  brandStoryHref: string;
  cartCount: number;
  cartHref: string;
  cartStoryHref: string;
  links: DraftLink[];
  adminHref: string;
  adminStoryHref: string;
  cartButton?: ReactNode;
  loginHref: string;
  loginStoryHref?: string;
  onCartClick?: () => void;
}

export function NavbarDefault(props?: Partial<NavbarDefaultProps>) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const {
    brand,
    activeHref,
    brandHref,
    brandStoryHref,
    cartCount,
    cartHref,
    cartStoryHref,
    links,
    adminHref,
    adminStoryHref,
    cartButton,
    loginHref,
    loginStoryHref,
    onCartClick,
  } = {
    ...defaultNavbarDefaultProps,
    ...props,
  };
  const mobileMenuButtonLabel = isMobileMenuOpen
    ? "Close navigation menu"
    : "Open navigation menu";

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  function handleMobileCartClick() {
    onCartClick?.();
    closeMobileMenu();
  }

  return (
    <div
      className="sticky top-0 z-50 w-full shrink-0 border-b border-slate-200 bg-white/90 backdrop-blur-sm"
      data-ds-block="website-builder.widget.navbar-default"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <a
            className="inline-flex items-center gap-3 text-sm text-slate-900 no-underline"
            {...getStoryLinkProps(brandHref, brandStoryHref)}
          >
            <BrandMark />
            <span>{brand}</span>
          </a>
          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Primary"
          >
            {links.map((link) =>
              link.disabled ? (
                <span
                  key={link.label}
                  className="cursor-not-allowed rounded-md px-3 py-1.5 text-sm text-slate-400"
                  aria-disabled="true"
                >
                  {link.label}
                </span>
              ) : (
                <a
                  key={link.label}
                  className={`rounded-md px-3 py-1.5 text-sm no-underline transition ${
                    link.href === activeHref
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  {...getStoryLinkProps(link.href, link.storyHref)}
                >
                  {link.label}
                </a>
              ),
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 md:hidden"
            aria-label={mobileMenuButtonLabel}
            aria-expanded={isMobileMenuOpen}
            aria-controls="navbar-default-mobile-menu"
            onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
          {cartButton ??
            (onCartClick ? (
              <button
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                type="button"
                aria-label="Open cart"
                onClick={onCartClick}
              >
                <ShoppingCart className="h-4 w-4" />
                {cartCount ? (
                  <span className="absolute -right-1.5 -top-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] text-white">
                    {cartCount}
                  </span>
                ) : null}
              </button>
            ) : (
              <a
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 no-underline transition hover:bg-slate-50 hover:text-slate-900"
                aria-label="Open cart"
                {...getStoryLinkProps(cartHref, cartStoryHref)}
              >
                <ShoppingCart className="h-4 w-4" />
                {cartCount ? (
                  <span className="absolute -right-1.5 -top-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] text-white">
                    {cartCount}
                  </span>
                ) : null}
              </a>
            ))}
          <a
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 no-underline transition hover:bg-slate-50"
            {...getStoryLinkProps(loginHref, loginStoryHref)}
          >
            <LogIn className="h-4 w-4" />
            <span className="hidden sm:inline">Sign In</span>
          </a>
          <a
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 no-underline transition hover:bg-slate-50"
            {...getStoryLinkProps(adminHref, adminStoryHref)}
          >
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Admin Panel</span>
          </a>
        </div>
      </div>
      {isMobileMenuOpen ? (
        <div
          id="navbar-default-mobile-menu"
          className="border-t border-slate-200 bg-white md:hidden"
        >
          <div className="mx-auto w-full max-w-6xl space-y-3 px-6 py-4">
            <nav className="grid gap-2" aria-label="Mobile primary">
              {links.map((link) =>
                link.disabled ? (
                  <span
                    key={link.label}
                    className="cursor-not-allowed rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400"
                    aria-disabled="true"
                  >
                    {link.label}
                  </span>
                ) : (
                  <a
                    key={link.label}
                    className={`rounded-md border px-3 py-2 text-sm no-underline transition ${
                      link.href === activeHref
                        ? "border-slate-300 bg-slate-100 text-slate-900"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                    onClick={closeMobileMenu}
                    {...getStoryLinkProps(link.href, link.storyHref)}
                  >
                    {link.label}
                  </a>
                ),
              )}
            </nav>
            <div className="grid gap-2 border-t border-slate-100 pt-3">
              {onCartClick ? (
                <button
                  type="button"
                  className="inline-flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                  onClick={handleMobileCartClick}
                >
                  <span className="inline-flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Cart
                  </span>
                  {cartCount ? (
                    <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] text-white">
                      {cartCount}
                    </span>
                  ) : null}
                </button>
              ) : (
                <a
                  className="inline-flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 no-underline transition hover:bg-slate-50"
                  onClick={closeMobileMenu}
                  {...getStoryLinkProps(cartHref, cartStoryHref)}
                >
                  <span className="inline-flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Cart
                  </span>
                  {cartCount ? (
                    <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] text-white">
                      {cartCount}
                    </span>
                  ) : null}
                </a>
              )}
              <a
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 no-underline transition hover:bg-slate-50"
                onClick={closeMobileMenu}
                {...getStoryLinkProps(loginHref, loginStoryHref)}
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </a>
              <a
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 no-underline transition hover:bg-slate-50"
                onClick={closeMobileMenu}
                {...getStoryLinkProps(adminHref, adminStoryHref)}
              >
                <Shield className="h-4 w-4" />
                Admin Panel
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
