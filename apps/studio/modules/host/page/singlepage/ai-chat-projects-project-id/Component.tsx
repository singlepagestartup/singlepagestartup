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
          variant="ai-chat-project-select"
          profileId={profileId}
          {...props}
        />
      )}
      subjectAccount={({ onNavigate }) => (
        <RbacModuleSubject
          variant="ai-chat-account"
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
            variant="ai-chat-products"
            profileId={profileId}
            navigation={navigation}
          />
        )}
      </SocialModuleProfile>
    </HostModuleLayout>
  );
}
