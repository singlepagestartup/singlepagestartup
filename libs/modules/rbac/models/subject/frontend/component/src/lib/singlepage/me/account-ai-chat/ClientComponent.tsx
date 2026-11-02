"use client";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";
import { Component as SocialModuleProfile } from "@sps/social/models/profile/frontend/component";
import type {
  IComponentPropsExtended,
  IAccountEmailProps,
  IAccountAvatarProps,
  IAccountTokenBalanceProps,
  IAccountMenuProps,
} from "./interface";
import { Icon } from "@sps/ui-adapter";
import { internationalization } from "@sps/shared-configuration";

export function Component(props: IComponentPropsExtended) {
  return (
    <AccountMenu
      language={props.language}
      settingsSelected={props.settingsSelected}
      subjectId={props.data.id}
      subjectSlug={props.data.slug}
      profile={props.accountProfile}
      accountIdentities={props.accountIdentities}
      accountAvatar={props.accountAvatar}
      accountBalance={props.accountBalance}
    />
  );
}

function AccountEmail({ identities }: IAccountEmailProps) {
  return identities?.map(
    (identity) =>
      identity.email && (
        <span
          key={identity.id}
          className="mt-1 block break-all text-xs text-muted-foreground"
        >
          {identity.email}
        </span>
      ),
  );
}

function AccountAvatar(props: IAccountAvatarProps) {
  return (
    <SocialModuleProfile
      isServer={false}
      variant="chat-profile-avatar"
      language={props.language}
      data={props.profile}
      className="size-8"
      file={props.avatar?.file ?? null}
      fallback={props.fallback}
    />
  );
}

function AccountTokenBalance({ balance, language }: IAccountTokenBalanceProps) {
  const amount = Number(balance?.amount);
  const label =
    balance && Number.isFinite(amount)
      ? new Intl.NumberFormat(language, { maximumFractionDigits: 6 }).format(
          amount,
        )
      : "—";
  return (
    <span className="block text-xs font-normal text-muted-foreground">
      {label} {language === "ru" ? "токенов" : "tokens"}
    </span>
  );
}

function AccountMenu({
  subjectId,
  subjectSlug,
  profile,
  language = internationalization.defaultLanguage.code,
  settingsSelected,
  accountIdentities,
  accountAvatar,
  accountBalance,
}: IAccountMenuProps) {
  const localeBase = `/${language}`;
  const logout = subjectApi.authenticationLogout({});
  const name =
    profile?.title?.[language] ||
    profile?.title?.en ||
    profile?.slug ||
    subjectSlug ||
    (language === "ru" ? "Мой аккаунт" : "My account");
  const fallbackAvatar = (
    <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-muted">
      <Icon name="user-circle" size={24} className="size-6" />
    </span>
  );
  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant="me-account-ai-chat"
      data-id={subjectId}
    >
      <DropdownMenu.Root modal={false}>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            aria-label={`${name}, ${language === "ru" ? "меню аккаунта" : "account menu"}`}
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl px-2 py-2 text-left hover:bg-muted data-[state=open]:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            {profile ? (
              <AccountAvatar
                subjectId={subjectId}
                language={language}
                profile={profile}
                fallback={fallbackAvatar}
                avatar={accountAvatar}
              />
            ) : (
              fallbackAvatar
            )}
            <span className="hidden sm:block">
              <span
                title={name}
                className="block max-w-32 truncate text-sm font-semibold"
              >
                {name}
              </span>
              <AccountTokenBalance
                subjectId={subjectId}
                language={language}
                balance={accountBalance}
              />
            </span>
            <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            collisionPadding={12}
            className="z-[110] w-64 max-w-[calc(100vw-24px)] rounded-xl border border-border bg-card p-2 font-default text-foreground shadow-lg"
          >
            <DropdownMenu.Label className="px-3 py-2">
              <span className="block truncate text-sm font-semibold">
                {name}
              </span>
              <AccountTokenBalance
                subjectId={subjectId}
                language={language}
                balance={accountBalance}
              />
              <AccountEmail identities={accountIdentities} />
            </DropdownMenu.Label>
            <DropdownMenu.Separator className="my-1 h-px bg-border" />
            <DropdownMenu.Item asChild>
              <Link
                href={`${localeBase}/ai-chat/settings`}
                aria-current={settingsSelected ? "page" : undefined}
                className={menuItemClassName}
              >
                <Settings className="size-5" />
                {language === "ru" ? "Настройки" : "Settings"}
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="my-1 h-px bg-border" />
            <DropdownMenu.Item asChild disabled={logout.isPending}>
              <button
                type="button"
                disabled={logout.isPending}
                onClick={() =>
                  logout.mutate({ redirectTo: `${localeBase}/ai-chat/sign-in` })
                }
                className={`${menuItemClassName} w-full disabled:opacity-50`}
              >
                <LogOut className="size-5" />
                {logout.isPending
                  ? language === "ru"
                    ? "Выход…"
                    : "Signing out…"
                  : language === "ru"
                    ? "Выйти"
                    : "Sign out"}
              </button>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}

const menuItemClassName =
  "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none data-highlighted:bg-muted data-highlighted:text-foreground";
