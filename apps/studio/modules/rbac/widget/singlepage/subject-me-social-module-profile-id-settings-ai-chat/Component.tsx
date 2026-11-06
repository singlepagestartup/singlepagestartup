"use client";
import type {
  IComponentProps,
  ISubjectProfileSettingsProps,
} from "./interface";
export type { ISubjectProfileSettingsProps } from "./interface";

import { Component as SocialModuleProfile } from "../../../../social/profile";
import { useStudioAccount } from "../../../subject/singlepage/me/account/Account";
import { Component as Subject } from "../../../subject";
import { Component as WorkspaceSkeleton } from "../subject-me-social-module-profile-id-chat-id-thread-id-ai-chat/Skeleton";
import { Component as WorkspaceNotice } from "../subject-me-social-module-profile-id-chat-id-thread-id-ai-chat/Error";
import type { ISubjectThreadWorkspaceProps } from "../subject-me-social-module-profile-id-chat-id-thread-id-ai-chat/Component";

export function Component({
  variant = "subject-me-social-module-profile-id-settings-ai-chat",
  state = "ready",
  errorMessage,
  onRetry,
  subjectId,
  profileId,
}: IComponentProps) {
  const { account } = useStudioAccount();
  const actor = subjectId ?? account.subject?.id;
  if (
    state === "checking-session" ||
    state === "loading-projects" ||
    state === "loading-chat"
  )
    return <WorkspaceSkeleton variant={variant} stage={state} />;
  if (
    state === "sign-in-required" ||
    state === "access-denied" ||
    state === "error"
  )
    return (
      <WorkspaceNotice
        variant={variant}
        state={state}
        message={errorMessage}
        onRetry={onRetry}
      />
    );

  return (
    <div
      data-ds-block={`rbac.widget.${variant}`}
      data-module="rbac"
      data-model="widget"
      data-variant={variant}
      data-subject-id={actor}
      data-profile-id={profileId}
    >
      <SocialModuleProfile
        variant="id-ai-chat-project"
        profileId={profileId}
        selected="settings"
      >
        {(navigation) => (
          <SocialModuleProfile
            variant="settings-ai-chat-project"
            profileId={profileId}
            navigation={navigation}
          >
            <Subject
              variant="me-social-module-profile-id-update-name-ai-chat"
              profileId={profileId}
              subjectId={actor}
            />
          </SocialModuleProfile>
        )}
      </SocialModuleProfile>
    </div>
  );
}
