"use client";

import { ImageUploadField } from "@sps/shared-ui-shadcn";
import { Component as SocialModuleProfile } from "@sps/social/models/profile/frontend/component";
import type {
  IModel as IProfile,
  IProfileAvatar,
} from "@sps/social/models/profile/sdk/model";
import { Icon } from "@sps/ui-adapter";

interface IAvatarFieldProps {
  language: string;
  profile: IProfile;
  file?: IProfileAvatar | null;
  pending: boolean;
  onSave: (data: { file: File } | { reset: true }) => Promise<unknown>;
}

export function AvatarField(props: IAvatarFieldProps) {
  const ru = props.language === "ru";
  return (
    <div className="mt-6">
      <ImageUploadField
        language={props.language}
        label={ru ? "Аватар" : "Avatar"}
        chooseLabel={ru ? "Выбрать аватар профиля" : "Choose profile avatar"}
        savedLabel={ru ? "Аватар сохранён" : "Avatar saved"}
        pending={props.pending}
        allowGif
        canRemove
        onSave={props.onSave}
        preview={
          <div className="size-20 overflow-hidden rounded-2xl bg-muted">
            <SocialModuleProfile
              isServer={false}
              variant="chat-profile-avatar"
              data={props.profile}
              language={props.language}
              file={props.file}
              className="size-20 rounded-2xl"
              fallback={
                <span className="grid size-20 place-items-center rounded-2xl bg-muted">
                  <Icon name="user-circle" className="size-12" />
                </span>
              }
            />
          </div>
        }
      />
    </div>
  );
}
