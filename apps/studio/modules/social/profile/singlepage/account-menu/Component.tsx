"use client";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useEffect, useState } from "react";
import {
  Icon,
  kit,
} from "../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import type { IAIChatUserProfile } from "../../../../../workspace/utils/products/ai-chat-models";
import { aiChatAccount } from "../../../../../workspace/utils/products/ai-chat-account-fixture";

export interface IAccountMenuProps {
  data?: IAIChatUserProfile;
  email?: string;
  balance?: { free: number; purchased: number } | null;
  showTokens?: boolean;
  page?: string;
  settingsHref?: string;
  settingsTarget?: "_top";
  onNavigate?: () => void;
  onSignOut?: () => void;
}
const menuItemClassName =
  "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none data-highlighted:bg-sps-grey data-highlighted:text-sps-graphite";
export function Component({
  data = aiChatAccount.profile,
  email = aiChatAccount.email,
  balance = aiChatAccount.balance,
  showTokens = false,
  page,
  settingsHref = "/ai-chat/settings",
  settingsTarget,
  onNavigate,
  onSignOut,
}: IAccountMenuProps = {}) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  useEffect(() => setAvatarFailed(false), [data.avatar]);
  const balanceLabel = balance
    ? `${(balance.free + balance.purchased).toLocaleString("en-US")} tokens`
    : "Balance unavailable";
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={
            showTokens
              ? `${data.title}, ${balanceLabel}`
              : `${data.title}, account menu`
          }
          data-ds-block="social.profile.account-menu"
          data-profile-id={data.id}
          onClick={onNavigate}
          className={`inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-xl px-2 py-2 text-left hover:bg-sps-grey data-[state=open]:bg-sps-grey ${kit.focus} ${page === "settings" || page === "tokens" ? "bg-sps-grey" : ""}`}
        >
          <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-sps-grey">
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
              <span className="block text-xs text-sps-muted">
                {balanceLabel}
              </span>
            )}
          </span>
          <Icon
            name="caret-down"
            className="hidden size-4 text-sps-muted sm:block"
          />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="z-[110] w-64 max-w-[calc(100vw-24px)] rounded-xl border border-sps-line bg-sps-white p-2 font-sps text-sps-graphite shadow-lg"
        >
          <DropdownMenu.Label className="px-3 py-2">
            <span className="block truncate text-sm font-semibold">
              {data.title}
            </span>
            {showTokens && (
              <span className="mt-1 block text-xs text-sps-muted">
                {balanceLabel}
              </span>
            )}
            {email && (
              <span className="mt-1 block break-all text-xs text-sps-muted">
                {email}
              </span>
            )}
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="my-1 h-px bg-sps-line" />
          {showTokens && (
            <DropdownMenu.Item asChild>
              <a
                href="/ai-chat/tokens"
                aria-current={page === "tokens" ? "page" : undefined}
                className={menuItemClassName}
              >
                <Icon name="wallet" />
                Buy tokens
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
              Settings
            </a>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <a
              href="/?path=/story/modules-host-models-page-singlepage-admin-settings--default"
              target="_top"
              className={menuItemClassName}
            >
              <Icon name="shield" />
              Admin Panel
            </a>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-sps-line" />
          <DropdownMenu.Item asChild>
            <button
              type="button"
              onClick={onSignOut}
              className={`${menuItemClassName} w-full`}
            >
              <Icon name="sign-out" />
              Sign out
            </button>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
