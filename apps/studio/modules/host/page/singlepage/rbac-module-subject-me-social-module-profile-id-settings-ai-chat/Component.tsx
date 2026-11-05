"use client";
import type { IComponentProps, IProfilePageProps } from "./interface";
export type { IProfilePageProps } from "./interface";

import { Component as RbacModuleWidget } from "../../../../rbac/widget/index";
import { Component as Layout } from "../../../layout/index";
import { Component as SocialModuleProfile } from "../../../../social/profile/index";
import { Component as RbacModuleSubject } from "../../../../rbac/subject/index";
import type { IProfilePageProps as IWorkspacePageProps } from "../rbac-module-subject-me-social-module-profile-id-chat-id-thread-id-ai-chat";

export function Component({
  variant = "rbac-module-subject-me-social-module-profile-id-settings-ai-chat",
  state = "ready",
  errorMessage,
  onRetry,
  profileId,
}: IComponentProps) {
  return (
    <div data-module="host" data-model="page" data-variant={variant}>
      <Layout
        variant="ai-chat-dashboard"
        page="chat"
        profileSelect={
          state === "ready"
            ? (props) => (
                <SocialModuleProfile
                  profileId={profileId}
                  {...props}
                  variant="select-ai-chat-project"
                />
              )
            : undefined
        }
        subjectAccount={({ onNavigate }) => (
          <RbacModuleSubject
            variant="me-account"
            showTokens
            page="chat"
            onNavigate={onNavigate}
          />
        )}
      >
        <RbacModuleWidget
          variant="subject-me-social-module-profile-id-settings-ai-chat"
          state={state}
          errorMessage={errorMessage}
          onRetry={onRetry}
          profileId={profileId}
        />
      </Layout>
    </div>
  );
}
