"use client";
import type { IComponentProps, IProfilePageProps } from "./interface";
export type { IProfilePageProps } from "./interface";

import { Component as RbacModuleWidget } from "../../../../rbac/widget/index";
import { Component as Layout } from "../../../layout/index";
import { Component as SocialModuleProfile } from "../../../../social/profile/index";
import { Component as RbacModuleSubject } from "../../../../rbac/subject/index";
import { aiChatProfileChatId } from "../../../layout/singlepage/ai-chat-landing/routes";
import { useStudioAccount } from "../../../../rbac/subject/singlepage/me/account/Account";

export function Component({
  variant = "rbac-module-subject-me-social-module-profile-id-chat-id-thread-id-ai-chat",
  profileId,
  state = "ready",
  errorMessage,
  onRetry,
}: IComponentProps) {
  const { signedIn } = useStudioAccount();
  return (
    <div data-module="host" data-model="page" data-variant={variant}>
      <Layout
        variant="ai-chat-dashboard"
        page="chat"
        profileSelect={
          signedIn && (state === "ready" || state === "loading-chat")
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
          variant="subject-me-social-module-profile-id-chat-id-thread-id-ai-chat"
          state={state}
          errorMessage={errorMessage}
          onRetry={onRetry}
          profileId={profileId}
          chatId={aiChatProfileChatId(profileId)}
        />
      </Layout>
    </div>
  );
}
