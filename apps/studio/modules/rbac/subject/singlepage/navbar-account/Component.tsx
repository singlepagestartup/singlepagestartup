"use client";
import { useEffect, useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  ChevronDown,
  CircleUserRound,
  LogIn,
  LogOut,
  MessageSquare,
  Shield,
  User,
} from "../../../../../workspace/utils/components/ModuleIcons";
import {
  clearRbacStudioAuthUser,
  defaultRbacUser,
  readRbacStudioAuthUser,
  RBAC_STUDIO_AUTH_CHANGE_EVENT,
  type RbacAccountUser,
} from "../../../shared";

export interface INavbarAccountProps {
  signedIn?: boolean;
  user?: RbacAccountUser;
}
const linkClass =
  "flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--workspace-brand-foreground)] no-underline outline-none hover:bg-[var(--workspace-brand-background)] data-highlighted:bg-[var(--workspace-brand-background)]";
const actions = [
  {
    label: "My Profile",
    story: "blog-authors-social-profiles-slug",
    icon: User,
  },
  {
    label: "Team Chat",
    story: "social-chats-social-chats-id-threads-social-threads-id",
    icon: MessageSquare,
  },
  { label: "Account Settings", story: "rbac-subject-settings", icon: User },
  { label: "Admin Panel", story: "admin-settings", icon: Shield },
];
export function Component({ signedIn, user }: INavbarAccountProps = {}) {
  const [storedUser, setStoredUser] = useState(() => readRbacStudioAuthUser());
  const [signedOut, setSignedOut] = useState(false);
  useEffect(() => {
    function syncUser() {
      setStoredUser(readRbacStudioAuthUser());
      setSignedOut(false);
    }
    window.addEventListener("storage", syncUser);
    window.addEventListener(RBAC_STUDIO_AUTH_CHANGE_EVENT, syncUser);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener(RBAC_STUDIO_AUTH_CHANGE_EVENT, syncUser);
    };
  }, []);
  const authenticated = !signedOut && (signedIn ?? Boolean(user ?? storedUser));
  const account = user ?? storedUser ?? defaultRbacUser;
  if (!authenticated)
    return (
      <a
        data-ds-block="rbac.subject.navbar-account"
        href="/?path=/story/modules-host-models-page-singlepage-rbac-subject-authentication-select-method--default"
        target="_top"
        className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-[var(--workspace-brand-line)] px-3 text-sm text-[var(--workspace-brand-foreground)] no-underline hover:bg-[var(--workspace-brand-background)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)]"
      >
        <LogIn className="size-5" />
        <span className="hidden sm:inline">Sign in</span>
        <span className="sr-only sm:hidden">Sign in</span>
      </a>
    );
  return (
    <div data-ds-block="rbac.subject.navbar-account">
      <DropdownMenu.Root modal={false}>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            aria-label="Open profile menu"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--workspace-brand-line)] px-2.5 text-sm text-[var(--workspace-brand-foreground)] hover:bg-[var(--workspace-brand-background)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)]"
          >
            {account.avatar ? (
              <img
                alt=""
                className="size-6 rounded-full object-cover"
                src={account.avatar}
              />
            ) : (
              <CircleUserRound className="size-5" />
            )}
            <span className="hidden max-w-28 truncate sm:block">
              {account.name.split(" ")[0]}
            </span>
            <ChevronDown className="size-4" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            className="z-[110] w-64 rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-1.5 shadow-lg"
          >
            <div className="border-b border-[var(--workspace-brand-line)] px-3 py-3">
              <p className="truncate text-sm font-medium text-[var(--workspace-brand-foreground)]">
                {account.name}
              </p>
              <p className="truncate text-xs text-[var(--workspace-brand-muted)]">
                {account.email}
              </p>
            </div>
            {actions.map(({ label, story, icon: Icon }) => (
              <DropdownMenu.Item key={story} asChild>
                <a
                  className={linkClass}
                  href={`/?path=/story/modules-host-models-page-singlepage-${story}--default`}
                  target="_top"
                >
                  <Icon className="size-5" />
                  {label}
                </a>
              </DropdownMenu.Item>
            ))}
            <DropdownMenu.Item asChild>
              <button
                type="button"
                className={`${linkClass} w-full text-[var(--workspace-brand-danger)]`}
                onClick={() => {
                  clearRbacStudioAuthUser();
                  setStoredUser(null);
                  setSignedOut(true);
                }}
              >
                <LogOut className="size-5" />
                Sign Out
              </button>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
