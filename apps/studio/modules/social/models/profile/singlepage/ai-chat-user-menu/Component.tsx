"use client";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Icon,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import type { IAIChatUserProfile } from "../../../../../../workspace/utils/products/ai-chat-models";
export interface IUserProfileMenuProps {
  data: IAIChatUserProfile;
  email?: string;
  balance: { free: number; purchased: number } | null;
  page: string;
  onNavigate?: () => void;
}
export function Component({
  data,
  email,
  balance,
  page,
  onNavigate,
}: IUserProfileMenuProps) {
  const balanceLabel = balance
    ? `${(balance.free + balance.purchased).toLocaleString("en-US")} tokens`
    : "Balance unavailable";
  const menuItemClassName =
    "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none data-highlighted:bg-sps-grey data-highlighted:text-sps-graphite";
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={`${data.title}, ${balanceLabel}`}
          data-ds-block="social.profile.ai-chat-user-menu"
          data-profile-id={data.id}
          onClick={() => onNavigate?.()}
          className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl px-2 py-2 @[800px]:ml-2 @[800px]:min-h-12 @[800px]:px-3 text-left hover:bg-sps-grey data-[state=open]:bg-sps-grey ${kit.focus} ${page === "settings" || page === "tokens" ? "bg-sps-grey" : ""}`}
        >
          <Icon name="user-circle" className="size-6" />
          <span className="hidden min-w-0 @[800px]:block">
            <span className="block text-sm font-semibold">{data.title}</span>
            <span className="block text-xs text-sps-muted">{balanceLabel}</span>
          </span>
          <Icon
            name="caret-down"
            className="hidden size-4 text-sps-muted @[800px]:block"
          />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="z-50 w-64 max-w-[calc(100vw-24px)] rounded-xl border border-sps-line bg-sps-white p-2 text-sps-graphite shadow-lg font-sps"
        >
          <DropdownMenu.Label className="px-3 py-2">
            <span className="block text-sm font-semibold">{data.title}</span>
            <span className="mt-1 block text-xs text-sps-muted">
              {balanceLabel}
            </span>
            {email && (
              <span className="mt-1 block break-all text-xs text-sps-muted">
                {email}
              </span>
            )}
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="my-1 h-px bg-sps-line" />
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
          <DropdownMenu.Item asChild>
            <a
              href="/ai-chat/settings"
              aria-current={page === "settings" ? "page" : undefined}
              className={menuItemClassName}
            >
              <Icon name="gear-six" />
              Settings
            </a>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
