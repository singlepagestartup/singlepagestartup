import { type ReactNode, useState, useEffect, useRef } from "react";
import { BrandMark } from "../../../../../../workspace/utils/components/BrandMark";

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
} from "../../../../../../workspace/utils/components/ModuleIcons";

interface StudioLink {
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
  ] satisfies StudioLink[],
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
  } as NavbarAuthUser,
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
  links: StudioLink[];
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
  const profileTrigger = useRef<HTMLButtonElement>(null);
  const profileMenu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isProfileMenuOpen) return;
    function dismiss(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !profileMenu.current?.contains(event.target) &&
        !profileTrigger.current?.contains(event.target)
      )
        setIsProfileMenuOpen(false);
    }
    window.addEventListener("pointerdown", dismiss);
    return () => window.removeEventListener("pointerdown", dismiss);
  }, [isProfileMenuOpen]);
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
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setIsMobileMenuOpen(false);
          setIsProfileMenuOpen(false);
          profileTrigger.current?.focus();
        }
      }}
      className="sticky top-0 z-50 w-full shrink-0 border-b border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)]/90 backdrop-blur-sm"
      data-ds-block="website-builder.widget.navbar-default"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto flex min-h-20 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-6">
          <a
            className="inline-flex items-center gap-3 text-base font-semibold text-[var(--workspace-brand-foreground)] no-underline"
            {...getStoryLinkProps(brandHref, brandStoryHref)}
          >
            <BrandMark />
            <span className="hidden min-[480px]:inline">{brand}</span>
          </a>
          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label="Primary"
          >
            {links.map((link) =>
              link.disabled ? (
                <span
                  key={link.label}
                  className="cursor-not-allowed inline-flex min-h-11 items-center rounded-xl px-3 py-2 text-sm text-[var(--workspace-brand-muted)]"
                  aria-disabled="true"
                >
                  {link.label}
                </span>
              ) : (
                <a
                  key={link.label}
                  aria-current={link.href === activeHref ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center rounded-xl px-3 py-2 text-sm font-medium no-underline transition ${
                    link.href === activeHref
                      ? "bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)]"
                      : "text-[var(--workspace-brand-muted)] hover:bg-[var(--workspace-brand-background)] hover:text-[var(--workspace-brand-foreground)]"
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
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] text-[var(--workspace-brand-muted)] transition hover:bg-[var(--workspace-brand-background)] hover:text-[var(--workspace-brand-foreground)] lg:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)]"
            aria-label={mobileMenuButtonLabel}
            aria-expanded={isMobileMenuOpen}
            aria-controls="navbar-default-mobile-menu"
            onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
          {cartButton ??
            (onCartClick ? (
              <button
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] text-[var(--workspace-brand-muted)] transition hover:bg-[var(--workspace-brand-background)] hover:text-[var(--workspace-brand-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)]"
                type="button"
                aria-label="Open cart"
                onClick={onCartClick}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount ? (
                  <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--workspace-brand-primary)] px-1 text-xs text-white">
                    {cartCount}
                  </span>
                ) : null}
              </button>
            ) : (
              <a
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] text-[var(--workspace-brand-muted)] no-underline transition hover:bg-[var(--workspace-brand-background)] hover:text-[var(--workspace-brand-foreground)]"
                aria-label="Open cart"
                {...getStoryLinkProps(cartHref, cartStoryHref)}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount ? (
                  <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--workspace-brand-primary)] px-1 text-xs text-white">
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
                ref={profileTrigger}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] px-2.5 text-sm text-[var(--workspace-brand-foreground)] transition hover:bg-[var(--workspace-brand-background)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)]"
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
                  <CircleUserRound className="h-5 w-5" />
                )}
                <span className="max-w-[7rem] truncate">
                  {activeAuthUser.name.split(" ")[0]}
                </span>
                <ChevronDown className="h-5 w-5 text-[var(--workspace-brand-muted)]" />
              </button>
              {isProfileMenuOpen ? (
                <div
                  className="absolute right-0 top-full z-[100] mt-2 w-64 overflow-hidden rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] shadow-lg"
                  ref={profileMenu}
                  role="menu"
                >
                  <div className="border-b border-[var(--workspace-brand-line)] px-3 py-3">
                    <p className="truncate text-sm font-medium text-[var(--workspace-brand-foreground)]">
                      {activeAuthUser.name}
                    </p>
                    <p className="truncate text-xs text-[var(--workspace-brand-muted)]">
                      {activeAuthUser.email}
                    </p>
                  </div>
                  <div className="grid gap-1 p-1.5">
                    <a
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-[var(--workspace-brand-foreground)] no-underline transition hover:bg-[var(--workspace-brand-background)]"
                      onClick={closeProfileMenu}
                      role="menuitem"
                      {...getStoryLinkProps(authHref, authStoryHref)}
                    >
                      <User className="h-5 w-5" />
                      My Profile
                    </a>
                    <a
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-[var(--workspace-brand-foreground)] no-underline transition hover:bg-[var(--workspace-brand-background)]"
                      onClick={closeProfileMenu}
                      role="menuitem"
                      {...getStoryLinkProps(chatHref, chatStoryHref)}
                    >
                      <MessageSquare className="h-5 w-5" />
                      Team Chat
                    </a>
                    <a
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-[var(--workspace-brand-foreground)] no-underline transition hover:bg-[var(--workspace-brand-background)]"
                      onClick={closeProfileMenu}
                      role="menuitem"
                      {...getStoryLinkProps(
                        accountSettingsHref,
                        accountSettingsStoryHref,
                      )}
                    >
                      <Shield className="h-5 w-5" />
                      Account Settings
                    </a>
                    <button
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm text-[var(--workspace-brand-danger)] transition hover:bg-[var(--workspace-brand-danger-surface)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)] min-h-11"
                      onClick={handleLogout}
                      role="menuitem"
                      type="button"
                    >
                      <LogOut className="h-5 w-5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <a
              className="hidden min-h-11 items-center gap-1.5 rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] px-3 text-sm text-[var(--workspace-brand-foreground)] no-underline transition hover:bg-[var(--workspace-brand-background)] sm:inline-flex"
              aria-label={authLabel}
              {...getStoryLinkProps(authHref, authStoryHref)}
            >
              <LogIn className="h-5 w-5" />
              <span>{authLabel}</span>
            </a>
          )}
          <a
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] px-3 py-1.5 text-sm text-[var(--workspace-brand-foreground)] no-underline transition hover:bg-[var(--workspace-brand-background)]"
            {...getStoryLinkProps(adminHref, adminStoryHref)}
          >
            <Shield className="h-5 w-5" />
            <span className="hidden sm:inline">Admin Panel</span>
          </a>
        </div>
      </div>
      {isMobileMenuOpen ? (
        <div
          id="navbar-default-mobile-menu"
          className="border-t border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] lg:hidden"
        >
          <div className="mx-auto w-full max-w-6xl space-y-3 px-6 py-4">
            <nav className="grid gap-2" aria-label="Mobile primary">
              {links.map((link) =>
                link.disabled ? (
                  <span
                    key={link.label}
                    className="cursor-not-allowed rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] px-3 py-2 text-sm text-[var(--workspace-brand-muted)]"
                    aria-disabled="true"
                  >
                    {link.label}
                  </span>
                ) : (
                  <a
                    key={link.label}
                    className={`rounded-xl border px-3 py-2 text-sm no-underline transition ${
                      link.href === activeHref
                        ? "border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)]"
                        : "border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] text-[var(--workspace-brand-muted)] hover:bg-[var(--workspace-brand-background)] hover:text-[var(--workspace-brand-foreground)]"
                    }`}
                    onClick={closeMobileMenu}
                    {...getStoryLinkProps(link.href, link.storyHref)}
                  >
                    {link.label}
                  </a>
                ),
              )}
            </nav>
            <div className="grid gap-2 border-t border-[var(--workspace-brand-line)] pt-3">
              {onCartClick ? (
                <button
                  type="button"
                  className="inline-flex items-center justify-between rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] px-3 py-2 text-sm text-[var(--workspace-brand-foreground)] transition hover:bg-[var(--workspace-brand-background)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)] min-h-11"
                  onClick={handleMobileCartClick}
                >
                  <span className="inline-flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Cart
                  </span>
                  {cartCount ? (
                    <span className="rounded-full bg-[var(--workspace-brand-primary)] px-2 py-0.5 text-xs text-white">
                      {cartCount}
                    </span>
                  ) : null}
                </button>
              ) : (
                <a
                  className="inline-flex items-center justify-between rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] px-3 py-2 text-sm text-[var(--workspace-brand-foreground)] no-underline transition hover:bg-[var(--workspace-brand-background)]"
                  onClick={closeMobileMenu}
                  {...getStoryLinkProps(cartHref, cartStoryHref)}
                >
                  <span className="inline-flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Cart
                  </span>
                  {cartCount ? (
                    <span className="rounded-full bg-[var(--workspace-brand-primary)] px-2 py-0.5 text-xs text-white">
                      {cartCount}
                    </span>
                  ) : null}
                </a>
              )}
              {isAuthenticated ? (
                <div className="rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-2">
                  <div className="flex items-center gap-2 border-b border-[var(--workspace-brand-line)] px-1 pb-2">
                    {activeAuthUser.avatar ? (
                      <img
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                        src={activeAuthUser.avatar}
                      />
                    ) : (
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-muted)]">
                        <CircleUserRound className="h-5 w-5" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--workspace-brand-foreground)]">
                        {activeAuthUser.name}
                      </p>
                      <p className="truncate text-xs text-[var(--workspace-brand-muted)]">
                        {activeAuthUser.email}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 grid gap-1">
                    <a
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 py-2 text-sm text-[var(--workspace-brand-foreground)] no-underline transition hover:bg-[var(--workspace-brand-background)]"
                      onClick={closeMobileMenu}
                      {...getStoryLinkProps(authHref, authStoryHref)}
                    >
                      <User className="h-5 w-5" />
                      My Profile
                    </a>
                    <a
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 py-2 text-sm text-[var(--workspace-brand-foreground)] no-underline transition hover:bg-[var(--workspace-brand-background)]"
                      onClick={closeMobileMenu}
                      {...getStoryLinkProps(chatHref, chatStoryHref)}
                    >
                      <MessageSquare className="h-5 w-5" />
                      Team Chat
                    </a>
                    <a
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 py-2 text-sm text-[var(--workspace-brand-foreground)] no-underline transition hover:bg-[var(--workspace-brand-background)]"
                      onClick={closeMobileMenu}
                      {...getStoryLinkProps(
                        accountSettingsHref,
                        accountSettingsStoryHref,
                      )}
                    >
                      <Shield className="h-5 w-5" />
                      Account Settings
                    </a>
                    <button
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 py-2 text-left text-sm text-[var(--workspace-brand-danger)] transition hover:bg-[var(--workspace-brand-danger-surface)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)] min-h-11"
                      onClick={handleLogout}
                      type="button"
                    >
                      <LogOut className="h-5 w-5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <a
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] px-3 py-2 text-sm text-[var(--workspace-brand-foreground)] no-underline transition hover:bg-[var(--workspace-brand-background)]"
                  onClick={closeMobileMenu}
                  {...getStoryLinkProps(authHref, authStoryHref)}
                >
                  <LogIn className="h-5 w-5" />
                  {authLabel}
                </a>
              )}
              <a
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] px-3 py-2 text-sm text-[var(--workspace-brand-foreground)] no-underline transition hover:bg-[var(--workspace-brand-background)]"
                onClick={closeMobileMenu}
                {...getStoryLinkProps(adminHref, adminStoryHref)}
              >
                <Shield className="h-5 w-5" />
                Admin Panel
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
