"use client";
import { Component as HostModuleLayout } from "../../../layout/index";
import { Component as SocialModuleProfile } from "../../../../social/profile/index";
import { Component as RbacModuleSubject } from "../../../../rbac/subject/index";

import { PanelHeader } from "../../../../../workspace/design/singlepage/interface-kit/ai-chat/ServiceDocument";

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
        selected="settings"
      >
        {(navigation) => (
          <section
            aria-label="Project settings"
            className="flex min-h-0 flex-1 flex-col"
          >
            <PanelHeader
              title="Project settings"
              label="Project"
              navigation={navigation}
            />
            <SocialModuleProfile
              variant="ai-chat-settings"
              profileId={profileId}
            />
          </section>
        )}
      </SocialModuleProfile>
    </HostModuleLayout>
  );
}
