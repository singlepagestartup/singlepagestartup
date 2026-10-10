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
              variant="settings-ai-chat-project"
              profileId={profileId}
            />
          </section>
        )}
      </SocialModuleProfile>
    </HostModuleLayout>
  );
}
