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
      variant="service-ai-chat"
      page="chat"
      profileSelect={(props) => (
        <SocialModuleProfile
          profileId={profileId}
          {...props}
          variant="select-ai-chat-project"
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
        variant="overview-ai-chat-project"
        profileId={profileId}
        selected="products"
      >
        {(navigation) => (
          <SocialModuleChat
            variant="overview-ai-chat"
            chatId={`${profileId}:project-chat`}
            navigation={navigation}
            messageCreate={
              <RbacModuleSubject variant="message-create-ai-chat" />
            }
          />
        )}
      </SocialModuleProfile>
    </HostModuleLayout>
  );
}
