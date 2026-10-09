"use client";
import { Component as HostModuleLayout } from "../../../layout/index";
import { Component as SocialModuleProfile } from "../../../../../social/models/profile/index";
import { Component as SocialModuleChat } from "../../../../../social/models/chat/index";
import { Component as RbacModuleSubject } from "../../../../../rbac/models/subject/index";

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
      <SocialModuleProfile variant="ai-chat-project" profileId={profileId}>
        <HostModuleLayout
          variant="ai-chat-project"
          sidebar={(mobile) => (
            <SocialModuleProfile
              variant="ai-chat-sidebar"
              profileId={profileId}
              selected="products"
              mobile={mobile}
            />
          )}
        >
          {(navigation) => (
            <SocialModuleChat
              variant="ai-chat-products"
              profileId={profileId}
              navigation={navigation}
            />
          )}
        </HostModuleLayout>
      </SocialModuleProfile>
    </HostModuleLayout>
  );
}
