"use client";
import { Component as HostModuleLayout } from "../../../layout/index";
import { Component as SocialModuleProfile } from "../../../../social/profile/index";
import { Component as SocialModuleChat } from "../../../../social/chat/index";
import { Component as RbacModuleSubject } from "../../../../rbac/subject/index";

export interface IProjectPageProps {
  profileId: string;
}
export function Component({ profileId }: IProjectPageProps) {
  return (
    <HostModuleLayout
      variant="ai-chat-header"
      page="chat"
      profileSelect={(props) => (
        <SocialModuleProfile
          profileId={profileId}
          {...props}
          variant="ai-chat-project-select"
        />
      )}
      subjectAccount={({ onNavigate }) => (
        <RbacModuleSubject
          variant="account"
          showTokens
          page="chat"
          onNavigate={onNavigate}
        />
      )}
    >
      <SocialModuleProfile
        variant="ai-chat-project-overview"
        profileId={profileId}
        selected="products"
      >
        {(navigation) => (
          <SocialModuleChat
            variant="ai-chat-overview"
            chatId={`${profileId}:project-chat`}
            navigation={navigation}
            messageCreate={
              <RbacModuleSubject variant="ai-chat-message-create" />
            }
          />
        )}
      </SocialModuleProfile>
    </HostModuleLayout>
  );
}
