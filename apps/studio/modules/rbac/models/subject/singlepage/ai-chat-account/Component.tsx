"use client";
import { Component as SocialModuleProfile } from "../../../../../social/models/profile/index";
import { useAIChatAccount } from "../ai-chat-account/Account";

import { Icon } from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
export interface ISubjectAccountProps {
  page: string;
  balance?: { free: number; purchased: number } | null;
  onNavigate?: () => void;
}
export function Component({ page, balance, onNavigate }: ISubjectAccountProps) {
  const account = useAIChatAccount();
  const profile = account.profile;
  return profile ? (
    <SocialModuleProfile
      variant="ai-chat-user-menu"
      data={profile}
      email={account.email}
      balance={balance === undefined ? account.balance : balance}
      page={page}
      onNavigate={onNavigate}
    />
  ) : (
    <button
      type="button"
      disabled
      aria-label="User profile unavailable"
      className="inline-flex size-11 items-center justify-center text-sps-muted"
    >
      <Icon name="user-circle" className="size-6" />
    </button>
  );
}
