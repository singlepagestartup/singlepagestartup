"use client";

import { internationalization } from "@sps/shared-configuration";
import { memo } from "react";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";
import type { IComponentPropsExtended } from "./interface";
import { AvatarField } from "./AvatarField";

export const Component = memo(function Component(
  props: IComponentPropsExtended,
) {
  const avatar = subjectApi.socialModuleProfileFindByIdAvatarUpdate({});
  return (
    <AvatarField
      language={props.language || internationalization.defaultLanguage.code}
      profile={props.profile}
      file={props.previewRead.data?.file ?? null}
      pending={avatar.isPending}
      onSave={(data) =>
        avatar.mutateAsync({
          id: props.data.id,
          socialModuleProfileId: props.profile.id,
          data,
        })
      }
    />
  );
});
