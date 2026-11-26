"use client";

import {
  Component as SocialProfile,
  getLocalizedPlainText,
} from "@sps/social/models/profile/frontend/component";
import type {
  IModel as IProfile,
  IProfilePresentation,
} from "@sps/social/models/profile/sdk/model";
import type { IChatProfileOpen } from "../interface";

interface IProps {
  language: string;
  subtitle?: string;
  onProfileOpen: IChatProfileOpen;
  profile: IProfile;
  presentation?: IProfilePresentation;
}

export function ChatParticipantButton({
  profile,
  presentation,
  subtitle,
  language,
  onProfileOpen,
}: IProps) {
  const ru = language === "ru";
  const name =
    getLocalizedPlainText(presentation?.title, language) ||
    getLocalizedPlainText(profile.title, language) ||
    profile.adminTitle?.trim() ||
    profile.slug ||
    (ru ? "Профиль" : "Profile");
  const openLabel = ru ? `Открыть профиль «${name}»` : `Open ${name} profile`;
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-label={openLabel}
      title={openLabel}
      className="group flex min-h-10 max-w-full cursor-pointer items-center gap-2 rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      onClick={(event) =>
        onProfileOpen(profile, event.currentTarget, presentation?.avatar, name)
      }
    >
      <SocialProfile
        variant="chat-profile-avatar"
        isServer={false}
        dataSource="props"
        language={language}
        data={presentation ?? profile}
        file={presentation?.avatar ?? null}
        className="size-9 bg-muted text-muted-foreground"
      />
      <span className="grid min-w-0 text-left">
        <span className="truncate decoration-muted-foreground/50 underline-offset-4 group-hover:underline">
          {name}
        </span>
        {subtitle && (
          <span className="truncate text-xs font-normal text-muted-foreground">
            {subtitle}
          </span>
        )}
      </span>
    </button>
  );
}
