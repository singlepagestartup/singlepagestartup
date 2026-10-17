"use client";
import { useCallback } from "react";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";
import { Component as SocialModuleProfile } from "@sps/social/models/profile/frontend/component";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import type { IModel as IProfile } from "@sps/social/models/profile/sdk/model";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const update = subjectApi.socialModuleProfileFindByIdUpdate({});
  const save = useCallback(
    (data: Pick<IProfile, "title" | "subtitle" | "description" | "slug">) =>
      update.mutateAsync({
        id: props.data.id,
        socialModuleProfileId: props.profile.id,
        data: {
          title: Object.fromEntries(
            Object.entries(data.title || {}).filter(
              (entry): entry is [string, string] =>
                typeof entry[1] === "string",
            ),
          ),
          subtitle: Object.fromEntries(
            Object.entries(data.subtitle || {}).filter(
              (entry): entry is [string, string] =>
                typeof entry[1] === "string",
            ),
          ),
          description: Object.fromEntries(
            Object.entries(data.description || {}).filter(
              (entry): entry is [string, string] =>
                typeof entry[1] === "string",
            ),
          ),
          slug: data.slug,
        },
      }),
    [update.mutateAsync, props.data.id, props.profile.id],
  );
  return (
    <SocialModuleProfile
      isServer={false}
      variant="id-settings-ai-chat"
      data={props.profile}
      onSave={save}
      pending={update.isPending}
    >
      <Subject
        isServer={false}
        variant="me-social-module-profile-id-avatar-update-ai-chat"
        data={props.data}
        profile={props.profile}
      />
    </SocialModuleProfile>
  );
}
