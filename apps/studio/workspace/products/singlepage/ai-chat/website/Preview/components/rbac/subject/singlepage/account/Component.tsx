"use client";
import IconGlyphs from "../../../../website-builder/feature/singlepage/icon/icons.json";
import { Component as SocialModuleProfile } from "../../../../social/profile/index";
import { useStudioAccount } from "./Account";
import type { RbacAccountUser } from "../../../shared";
import { aiChatAccount } from "./fixture";
function Icon({
  name,
  size = 20,
  className = "",
  svgProps,
}: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  const geometry = IconGlyphs[name]
    ?.replace(/^\s*<svg\b[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");
  if (!geometry) throw new Error("Missing Phosphor icon: " + name);
  return (
    <svg
      className={`shrink-0 ${size === 24 ? "size-6" : "size-5"} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="currentColor"
      data-icon-family="phosphor"
      data-icon-name={name}
      data-icon-weight="regular"
      aria-hidden="true"
      focusable="false"
      {...svgProps}
      dangerouslySetInnerHTML={{ __html: geometry }}
    />
  );
}
export interface ISubjectAccountProps {
  showTokens?: boolean;
  signedIn?: boolean;
  user?: RbacAccountUser;
  page?: string;
  balance?: {
    free: number;
    purchased: number;
  } | null;
  onNavigate?: () => void;
}
export function Component({
  showTokens = false,
  signedIn,
  user,
  page,
  balance,
  onNavigate,
}: ISubjectAccountProps = {}) {
  const session = useStudioAccount();
  const authenticated = signedIn ?? (user ? true : session.signedIn);
  const data = user
    ? {
        id: "current-user",
        title: user.name,
        avatar: user.avatar,
        variant: "user-ai-chat" as const,
      }
    : (session.account.profile ?? aiChatAccount.profile);
  const settingsHref = showTokens
    ? "/ai-chat/rbac/subjects/settings"
    : "/?path=/story/modules-host-models-page-singlepage-rbac-module-subject-me-settings--default";
  if (!authenticated)
    return (
      <a
        data-ds-block="rbac.subject.account"
        href={
          showTokens
            ? "/ai-chat/rbac/subjects/authentication/select-method"
            : "/?path=/story/modules-host-models-page-singlepage-rbac-module-subject-me-authentication-select-method--default"
        }
        target={showTokens ? undefined : "_top"}
        onClick={onNavigate}
        className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-sm text-[color:var(--workspace-brand-foreground)] no-underline hover:bg-[color:var(--workspace-brand-background)] ${kit.focus}`}
      >
        <Icon name="sign-in" />
        <span className="hidden sm:inline">Sign in</span>
        <span className="sr-only sm:hidden">Sign in</span>
      </a>
    );
  return (
    <div data-ds-block="rbac.subject.account">
      <SocialModuleProfile
        variant="account-menu"
        data={data}
        email={user?.email ?? session.account.email ?? aiChatAccount.email}
        balance={balance === undefined ? session.account.balance : balance}
        showTokens={showTokens}
        settingsHref={settingsHref}
        settingsTarget={showTokens ? undefined : "_top"}
        page={page}
        onNavigate={onNavigate}
        onSignOut={session.signOut}
      />
    </div>
  );
}
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--workspace-brand-foreground)]";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  button: `${buttonBase} bg-[color:var(--workspace-brand-accent)] text-[color:var(--workspace-brand-foreground)] enabled:hover:brightness-95 ${focus}`,
  secondary: `${buttonBase} border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] text-[color:var(--workspace-brand-foreground)] enabled:hover:bg-[color:var(--workspace-brand-background)] ${focus}`,
  plain: `${buttonBase} text-[color:var(--workspace-brand-muted)] enabled:hover:text-[color:var(--workspace-brand-foreground)] ${focus}`,
  danger: `${buttonBase} border border-[color:var(--workspace-brand-danger-line)] bg-[color:var(--workspace-brand-danger-surface)] text-[color:var(--workspace-brand-danger)] enabled:hover:brightness-95 ${focus}`,
  field:
    "min-h-12 w-full min-w-0 rounded-xl border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] px-4 py-2 text-base text-[color:var(--workspace-brand-foreground)] outline-none transition motion-reduce:transition-none placeholder:text-[color:var(--workspace-brand-muted)] focus-visible:border-[color:var(--workspace-brand-foreground)] focus-visible:ring-2 focus-visible:ring-[color:var(--workspace-brand-foreground)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--workspace-brand-surface)] disabled:cursor-not-allowed disabled:bg-[color:var(--workspace-brand-background)] disabled:text-[color:var(--workspace-brand-muted)] disabled:opacity-60 [&[readonly]]:bg-[color:var(--workspace-brand-background)] aria-invalid:border-[color:var(--workspace-brand-danger)] aria-invalid:focus-visible:ring-[color:var(--workspace-brand-danger)]",
  checkbox:
    "peer h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] text-[color:var(--workspace-brand-foreground)] checked:border-transparent checked:bg-[color:var(--workspace-brand-accent)] indeterminate:border-transparent indeterminate:bg-[color:var(--workspace-brand-accent)] disabled:cursor-not-allowed",
  card: "min-w-0 rounded-2xl border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] p-5",
  muted: "text-[color:var(--workspace-brand-muted)]",
  label: "text-sm font-semibold text-[color:var(--workspace-brand-foreground)]",
  focus: focus,
};
