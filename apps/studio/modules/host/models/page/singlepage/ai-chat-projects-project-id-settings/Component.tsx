"use client";
import { Component as HostModuleLayout } from "../../../layout/index";
import { Component as SocialModuleProfile } from "../../../../../social/models/profile/index";
import { Component as RbacModuleSubject } from "../../../../../rbac/models/subject/index";

import { PanelHeader } from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/ServiceDocument";

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
