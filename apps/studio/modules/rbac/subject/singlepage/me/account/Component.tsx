"use client";
import type { IComponentProps, ISubjectAccountProps } from "./interface";
export type { ISubjectAccountProps } from "./interface";

import { Component as SharedIcon } from "../../../../../shared/icon";

import type IconGlyphs from "../../../../../shared/icon/singlepage/phosphor/icons.json";
import { Component as SocialModuleProfile } from "../../../../../social/profile/index";
import { useStudioAccount } from "./Account";
import type { RbacAccountUser } from "../../../../shared";
import { aiChatAccount } from "./fixture";
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

export function Component({
  variant = "me-account",
  showTokens = false,
  authorPublished = true,
  signedIn,
  user,
  page,
  balance,
  onNavigate,
}: IComponentProps = {}) {
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
        data-ds-block="rbac.subject.me-account"
        href={
          showTokens
            ? "/ai-chat/rbac/subjects/authentication/select-method"
            : "/?path=/story/modules-host-models-page-singlepage-rbac-module-subject-me-authentication-select-method--default"
        }
        target={showTokens ? undefined : "_top"}
        onClick={onNavigate}
        className={`inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-xl px-2 py-2 text-left text-sm text-foreground no-underline hover:bg-muted ${kit.focus}`}
        data-module="rbac"
        data-model="subject"
        data-variant={variant}
      >
        <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-muted">
          <Icon name="user-circle" className="size-6" />
        </span>
        <span className="hidden text-sm font-semibold sm:inline">Sign in</span>
        <span className="sr-only sm:hidden">Sign in</span>
      </a>
    );
  return (
    <div
      data-ds-block="rbac.subject.me-account"
      data-module="rbac"
      data-model="subject"
      data-variant={variant}
    >
      <SocialModuleProfile
        variant="account-menu"
        data={data}
        email={user?.email ?? session.account.email ?? aiChatAccount.email}
        balance={balance === undefined ? session.account.balance : balance}
        showTokens={showTokens}
        settingsHref={settingsHref}
        createArticleHref={
          showTokens
            ? undefined
            : "/?path=/story/modules-rbac-models-widget-singlepage-subject-me-blog-module-article-create--default"
        }
        authorHref={
          !showTokens && authorPublished
            ? "/?path=/story/modules-social-models-widget-singlepage-author-overview-default--default"
            : undefined
        }
        chatsHref={
          showTokens
            ? "/ai-chat/projects"
            : "/?path=/story/modules-rbac-models-widget-singlepage-subject-me-social-module-profile-chat-list-default--default"
        }
        settingsTarget={showTokens ? undefined : "_top"}
        page={page}
        onNavigate={onNavigate}
        onSignOut={session.signOut}
      />
    </div>
  );
}
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  focus: focus,
};
