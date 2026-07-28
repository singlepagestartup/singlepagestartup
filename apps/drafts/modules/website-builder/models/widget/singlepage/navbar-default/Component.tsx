import { type ReactNode, useState } from "react";

import {
  ChevronDown,
  CircleUserRound,
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  Shield,
  ShoppingCart,
  User,
  X,
} from "lucide-react";

const brandMarkSrc = new URL("./assets/singlepagestartup.svg", import.meta.url)
  .href;

interface DraftLink {
  label: string;
  href: string;
  storyHref?: string;
  disabled?: boolean;
}

export interface NavbarAuthUser {
  name: string;
  email: string;
  role?: string;
  avatar?: string;
  profileHref?: string;
  profileStoryHref?: string;
  authorStoryHref?: string;
}

const hostStoryHref = (storyId: string) => `/?path=/story/${storyId}`;

const hostStoryHrefs = {
  adminSettings: hostStoryHref(
    "modules-host-models-page-singlepage-admin-settings--default",
  ),
  blog: hostStoryHref("modules-host-models-page-singlepage-blog--default"),
  cart: hostStoryHref(
    "modules-host-models-page-singlepage-ecommerce-products-ecommerce-products-slug--default",
  ),
  home: hostStoryHref("modules-host-models-page-singlepage-root--default"),
  login: hostStoryHref(
    "modules-host-models-page-singlepage-rbac-subject-authentication-select-method--default",
  ),
  chat: hostStoryHref(
    "modules-host-models-page-singlepage-social-chats-social-chats-id-threads-social-threads-id--default",
  ),
  authorProfile: hostStoryHref(
    "modules-host-models-page-singlepage-blog-authors-social-profiles-slug--default",
  ),
  profile: hostStoryHref(
    "modules-host-models-page-singlepage-rbac-subject-settings--default",
  ),
  services: hostStoryHref(
    "modules-host-models-page-singlepage-ecommerce-products--default",
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
  isAuthenticated: false,
  authUser: {
    name: "Sarah Kim",
    email: "sarah@sps.dev",
    role: "Head of Product",
    avatar:
      "https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=160",
    profileHref: "/blog/authors/[social.profiles.slug]",
    profileStoryHref: hostStoryHrefs.authorProfile,
  } satisfies NavbarAuthUser,
  loginHref: "/rbac/subject/authentication/select-method",
  loginStoryHref: hostStoryHrefs.login,
  profileHref: "/blog/authors/[social.profiles.slug]",
  profileStoryHref: hostStoryHrefs.authorProfile,
  accountSettingsHref: "/rbac/subject/settings",
  accountSettingsStoryHref: hostStoryHrefs.profile,
  chatHref: "/social/chats/[social.chats.id]/threads/[social.threads.id]",
  chatStoryHref: hostStoryHrefs.chat,
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
  isAuthenticated: boolean;
  authUser: NavbarAuthUser | null;
  loginHref: string;
  loginStoryHref?: string;
  onLogout?: () => void;
  onCartClick?: () => void;
  profileHref: string;
  profileStoryHref: string;
  accountSettingsHref: string;
  accountSettingsStoryHref: string;
  chatHref: string;
  chatStoryHref: string;
}

export function NavbarDefault(props?: Partial<NavbarDefaultProps>) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
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
    isAuthenticated,
    authUser,
    loginHref,
    loginStoryHref,
    onLogout,
    onCartClick,
    profileHref,
    profileStoryHref,
    accountSettingsHref,
    accountSettingsStoryHref,
    chatHref,
    chatStoryHref,
  } = {
    ...defaultNavbarDefaultProps,
    ...props,
  };
  const activeAuthUser = authUser ?? defaultNavbarDefaultProps.authUser;
  const activeProfileHref = activeAuthUser.profileHref ?? profileHref;
  const activeProfileStoryHref =
    activeAuthUser.profileStoryHref ??
    activeAuthUser.authorStoryHref ??
    profileStoryHref;
  const authHref = isAuthenticated ? activeProfileHref : loginHref;
  const authStoryHref = isAuthenticated
    ? activeProfileStoryHref
    : loginStoryHref;
  const authLabel = isAuthenticated ? "Profile" : "Sign In";
  const mobileMenuButtonLabel = isMobileMenuOpen
    ? "Close navigation menu"
    : "Open navigation menu";

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  function closeProfileMenu() {
    setIsProfileMenuOpen(false);
  }

  function handleMobileCartClick() {
    onCartClick?.();
    closeMobileMenu();
  }

  function handleLogout() {
    onLogout?.();
    closeMobileMenu();
    closeProfileMenu();

    if (typeof window === "undefined") return;

    const targetWindow = window.top ?? window;
    targetWindow.location.href = brandStoryHref || brandHref;
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
          {isAuthenticated ? (
            <div className="relative hidden sm:block">
              <button
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="menu"
                aria-label="Open profile menu"
                className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                onClick={() => setIsProfileMenuOpen((isOpen) => !isOpen)}
                type="button"
              >
                {activeAuthUser.avatar ? (
                  <img
                    alt=""
                    className="h-6 w-6 rounded-full object-cover"
                    src={activeAuthUser.avatar}
                  />
                ) : (
                  <CircleUserRound className="h-4 w-4" />
                )}
                <span className="max-w-[7rem] truncate">
                  {activeAuthUser.name.split(" ")[0]}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>
              {isProfileMenuOpen ? (
                <div
                  className="absolute right-0 top-full z-[100] mt-2 w-64 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                  role="menu"
                >
                  <div className="border-b border-slate-100 px-3 py-3">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {activeAuthUser.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {activeAuthUser.email}
                    </p>
                  </div>
                  <div className="grid gap-1 p-1.5">
                    <a
                      className="inline-flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-slate-700 no-underline transition hover:bg-slate-50"
                      onClick={closeProfileMenu}
                      role="menuitem"
                      {...getStoryLinkProps(authHref, authStoryHref)}
                    >
                      <User className="h-4 w-4" />
                      My Profile
                    </a>
                    <a
                      className="inline-flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-slate-700 no-underline transition hover:bg-slate-50"
                      onClick={closeProfileMenu}
                      role="menuitem"
                      {...getStoryLinkProps(chatHref, chatStoryHref)}
                    >
                      <MessageSquare className="h-4 w-4" />
                      Team Chat
                    </a>
                    <a
                      className="inline-flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-slate-700 no-underline transition hover:bg-slate-50"
                      onClick={closeProfileMenu}
                      role="menuitem"
                      {...getStoryLinkProps(
                        accountSettingsHref,
                        accountSettingsStoryHref,
                      )}
                    >
                      <Shield className="h-4 w-4" />
                      Account Settings
                    </a>
                    <button
                      className="inline-flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
                      onClick={handleLogout}
                      role="menuitem"
                      type="button"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <a
              className="hidden h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 no-underline transition hover:bg-slate-50 sm:inline-flex"
              aria-label={authLabel}
              {...getStoryLinkProps(authHref, authStoryHref)}
            >
              <LogIn className="h-4 w-4" />
              <span>{authLabel}</span>
            </a>
          )}
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
              {isAuthenticated ? (
                <div className="rounded-md border border-slate-200 bg-white p-2">
                  <div className="flex items-center gap-2 border-b border-slate-100 px-1 pb-2">
                    {activeAuthUser.avatar ? (
                      <img
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                        src={activeAuthUser.avatar}
                      />
                    ) : (
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                        <CircleUserRound className="h-4 w-4" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {activeAuthUser.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {activeAuthUser.email}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 grid gap-1">
                    <a
                      className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-700 no-underline transition hover:bg-slate-50"
                      onClick={closeMobileMenu}
                      {...getStoryLinkProps(authHref, authStoryHref)}
                    >
                      <User className="h-4 w-4" />
                      My Profile
                    </a>
                    <a
                      className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-700 no-underline transition hover:bg-slate-50"
                      onClick={closeMobileMenu}
                      {...getStoryLinkProps(chatHref, chatStoryHref)}
                    >
                      <MessageSquare className="h-4 w-4" />
                      Team Chat
                    </a>
                    <a
                      className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-700 no-underline transition hover:bg-slate-50"
                      onClick={closeMobileMenu}
                      {...getStoryLinkProps(
                        accountSettingsHref,
                        accountSettingsStoryHref,
                      )}
                    >
                      <Shield className="h-4 w-4" />
                      Account Settings
                    </a>
                    <button
                      className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
                      onClick={handleLogout}
                      type="button"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <a
                  className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 no-underline transition hover:bg-slate-50"
                  onClick={closeMobileMenu}
                  {...getStoryLinkProps(authHref, authStoryHref)}
                >
                  <LogIn className="h-4 w-4" />
                  {authLabel}
                </a>
              )}
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
