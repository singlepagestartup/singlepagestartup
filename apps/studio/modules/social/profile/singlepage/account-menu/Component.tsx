"use client";
import type { IComponentProps, IAccountMenuProps } from "./interface";
export type { IAccountMenuProps } from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useEffect, useState } from "react";
import type { IAIChatUserProfile } from "../scope/ai-chat/project/models";
import { aiChatAccount } from "../../../../rbac/subject/singlepage/me/account/fixture";
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

export function Component({
  variant = "account-menu",
  data = aiChatAccount.profile,
  email = aiChatAccount.email,
  balance = aiChatAccount.balance,
  showTokens = false,
  page,
  settingsHref = "/ai-chat/rbac/subjects/settings",
  settingsTarget,
  createArticleHref,
  authorHref,
  chatsHref,
  onNavigate,
  onSignOut,
}: IComponentProps = {}) {
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
          className={`inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-xl px-2 py-2 text-left hover:bg-muted data-[state=open]:bg-muted ${kit.focus} ${page === "settings" || page === "tokens" ? "bg-muted" : ""}`}
          data-module="social"
          data-model="profile"
          data-variant={variant}
        >
          <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-muted">
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
              <span className="block text-xs text-muted-foreground">
                {balanceLabel}
              </span>
            )}
          </span>
          <Icon
            name="caret-down"
            className="hidden size-4 text-muted-foreground sm:block"
          />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="z-[110] w-64 max-w-[calc(100vw-24px)] rounded-xl border border-border bg-card p-2 font-default text-foreground shadow-lg"
          data-module="social"
          data-model="profile"
          data-variant={variant}
        >
          <DropdownMenu.Label className="px-3 py-2">
            <span className="block truncate text-sm font-semibold">
              {data.title}
            </span>
            {showTokens && (
              <span className="mt-1 block text-xs text-muted-foreground">
                {balanceLabel}
              </span>
            )}
            {email && (
              <span className="mt-1 block break-all text-xs text-muted-foreground">
                {email}
              </span>
            )}
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          {createArticleHref ? (
            <DropdownMenu.Item asChild>
              <a
                href={createArticleHref}
                target={settingsTarget}
                className={menuItemClassName}
              >
                <Icon name="file-text" />
                Создать статью
              </a>
            </DropdownMenu.Item>
          ) : null}
          {authorHref ? (
            <DropdownMenu.Item asChild>
              <a
                href={authorHref}
                target={settingsTarget}
                className={menuItemClassName}
              >
                <Icon name="user-circle" />
                Моя страница автора
              </a>
            </DropdownMenu.Item>
          ) : null}
          {chatsHref ? (
            <DropdownMenu.Item asChild>
              <a
                href={chatsHref}
                target={settingsTarget}
                className={menuItemClassName}
              >
                <Icon name="chat-circle" />
                Мои обсуждения
              </a>
            </DropdownMenu.Item>
          ) : null}
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
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
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
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  focus: focus,
};
const menuItemClassName =
  "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none data-highlighted:bg-muted data-highlighted:text-foreground";
