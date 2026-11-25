"use client";

import type { ProfileSidebarProfileUpdateValues } from "../hooks/use-profile-sidebar";
import { Component as SocialModuleProfile } from "@sps/social/models/profile/frontend/component";
import type {
  IModel as ISocialModuleProfile,
  IProfileAvatar,
} from "@sps/social/models/profile/sdk/model";
import { AvatarField } from "../../../../../../../me/social-module/profile/id/avatar-update-ai-chat/AvatarField";
import { Dialog, SettingsDialogContent } from "@sps/shared-ui-shadcn";

interface ProfileEditDialogProps {
  avatar?: IProfileAvatar | null;
  isEmployee?: boolean;
  isOpen: boolean;
  isSaving: boolean;
  isSavingAvatar: boolean;
  language: string;
  onOpenChange: (open: boolean) => void;
  onAvatarSave: (data: { file: File } | { reset: true }) => Promise<unknown>;
  onSave: (values: ProfileSidebarProfileUpdateValues) => Promise<void>;
  profile: ISocialModuleProfile | null;
}

export function ProfileEditDialog(props: ProfileEditDialogProps) {
  const ru = props.language === "ru";
  const profile = props.profile;
  return (
    <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
      <SettingsDialogContent closeLabel={ru ? "Закрыть" : "Close"}>
        {props.isOpen && profile && (
          <SocialModuleProfile
            key={`${profile.id}:${props.language}`}
            isServer={false}
            variant="id-settings-ai-chat"
            dataSource="props"
            data={profile}
            mode="agent"
            dialogDescription={
              props.isEmployee
                ? ru
                  ? "Измените имя, заголовок и описание сотрудника магазина."
                  : "Edit the store employee’s name, headline and description."
                : ru
                  ? "Измените профиль ассистента в этом чате."
                  : "Edit the assistant’s profile in this chat."
            }
            language={props.language}
            pending={props.isSaving || props.isSavingAvatar}
            onSave={(draft) => {
              const changes: ProfileSidebarProfileUpdateValues = {};
              for (const field of [
                "title",
                "subtitle",
                "description",
              ] as const) {
                const translation = draft[field]?.[props.language];
                if (
                  typeof translation === "string" &&
                  translation !== profile[field]?.[props.language]
                ) {
                  changes[field] = { [props.language]: translation.trim() };
                }
              }
              return props.onSave(changes);
            }}
          >
            <AvatarField
              profile={profile}
              file={props.avatar}
              language={props.language}
              pending={props.isSavingAvatar || props.isSaving}
              onSave={props.onAvatarSave}
            />
          </SocialModuleProfile>
        )}
      </SettingsDialogContent>
    </Dialog>
  );
}
