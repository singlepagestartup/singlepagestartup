"use client";
import { Component as HostModuleLayout } from "../../../layout/index";
import { Component as SocialModuleProfile } from "../../../../social/profile/index";
import { Component as SocialModuleChat } from "../../../../social/chat/index";
import { Component as RbacModuleSubject } from "../../../../rbac/subject/index";
import { aiChatProfileChatId } from "../../../layout/singlepage/ai-chat-landing/routes";

export interface IProfilePageProps {
  profileId: string;
}
export function Component({ profileId }: IProfilePageProps) {
  return (
    <HostModuleLayout
      variant="ai-chat-dashboard"
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
            chatId={aiChatProfileChatId(profileId)}
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
