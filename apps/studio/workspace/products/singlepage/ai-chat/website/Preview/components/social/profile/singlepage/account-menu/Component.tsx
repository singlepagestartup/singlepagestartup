"use client";
import IconGlyphs from "../../../../website-builder/feature/singlepage/icon/icons.json";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useEffect, useState } from "react";
import type { IAIChatUserProfile } from "../scope/ai-chat/project/models";
import { aiChatAccount } from "../../../../rbac/subject/singlepage/account/fixture";
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
export interface IAccountMenuProps {
  data?: IAIChatUserProfile;
  email?: string;
  balance?: {
    free: number;
    purchased: number;
  } | null;
  showTokens?: boolean;
  page?: string;
  settingsHref?: string;
  settingsTarget?: "_top";
  onNavigate?: () => void;
  onSignOut?: () => void;
}
export function Component({
  data = aiChatAccount.profile,
  email = aiChatAccount.email,
  balance = aiChatAccount.balance,
  showTokens = false,
  page,
  settingsHref = "/ai-chat/rbac/subjects/settings",
  settingsTarget,
  onNavigate,
  onSignOut,
}: IAccountMenuProps = {}) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  useEffect(() => setAvatarFailed(false), [data.avatar]);
  const balanceLabel = balance
    ? `${(balance.free + balance.purchased).toLocaleString("ru-RU", { maximumFractionDigits: 6 })} токенов`
    : "— токенов";
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={
            showTokens
              ? `${data.title}, ${balanceLabel}`
              : `${data.title}, меню аккаунта`
          }
          data-ds-block="social.profile.account-menu"
          data-profile-id={data.id}
          onClick={onNavigate}
          className={`inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-xl px-2 py-2 text-left hover:bg-[color:var(--workspace-brand-background)] data-[state=open]:bg-[color:var(--workspace-brand-background)] ${kit.focus} ${page === "settings" || page === "tokens" ? "bg-[color:var(--workspace-brand-background)]" : ""}`}
        >
          <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-[color:var(--workspace-brand-background)]">
            {data.avatar && !avatarFailed ? (
              <img
                src={data.avatar}
                alt=""
                className="size-full object-cover"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <Icon name="user-circle" className="size-6" />
            )}
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="block max-w-32 truncate text-sm font-semibold">
              {data.title}
            </span>
            {showTokens && (
              <span className="block text-xs text-[color:var(--workspace-brand-muted)]">
                {balanceLabel}
              </span>
            )}
          </span>
          <Icon
            name="caret-down"
            className="hidden size-4 text-[color:var(--workspace-brand-muted)] sm:block"
          />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="z-[110] w-64 max-w-[calc(100vw-24px)] rounded-xl border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] p-2 font-[family-name:var(--workspace-brand-font-body)] text-[color:var(--workspace-brand-foreground)] shadow-lg"
        >
          <DropdownMenu.Label className="px-3 py-2">
            <span className="block truncate text-sm font-semibold">
              {data.title}
            </span>
            {showTokens && (
              <span className="mt-1 block text-xs text-[color:var(--workspace-brand-muted)]">
                {balanceLabel}
              </span>
            )}
            {email && (
              <span className="mt-1 block break-all text-xs text-[color:var(--workspace-brand-muted)]">
                {email}
              </span>
            )}
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="my-1 h-px bg-[color:var(--workspace-brand-line)]" />
          {showTokens && (
            <DropdownMenu.Item asChild>
              <a
                href="/ai-chat/rbac/subjects/tokens"
                aria-current={page === "tokens" ? "page" : undefined}
                className={menuItemClassName}
              >
                <Icon name="wallet" />
                Купить токены
              </a>
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Item asChild>
            <a
              href={settingsHref}
              target={settingsTarget}
              aria-current={page === "settings" ? "page" : undefined}
              className={menuItemClassName}
            >
              <Icon name="gear-six" />
              Настройки
            </a>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <a
              href="/?path=/story/modules-host-models-page-singlepage-admin-settings--default"
              target="_top"
              className={menuItemClassName}
            >
              <Icon name="shield" />
              Панель управления
            </a>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-[color:var(--workspace-brand-line)]" />
          <DropdownMenu.Item asChild>
            <button
              type="button"
              onClick={onSignOut}
              className={`${menuItemClassName} w-full`}
            >
              <Icon name="sign-out" />
              Выйти
            </button>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
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
const menuItemClassName =
  "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none data-highlighted:bg-[color:var(--workspace-brand-background)] data-highlighted:text-[color:var(--workspace-brand-foreground)]";
