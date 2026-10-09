"use client";
import { Component as HostModuleLayout } from "../../../layout/index";
import { Component as SocialModuleProfile } from "../../../../../social/models/profile/index";
import { Component as SocialModuleThread } from "../../../../../social/models/thread/index";
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
      <SocialModuleProfile variant="ai-chat-project" profileId={profileId}>
        <HostModuleLayout
          variant="ai-chat-project"
          sidebar={(mobile) => (
            <SocialModuleProfile
              variant="ai-chat-sidebar"
              profileId={profileId}
              selected="thread-create"
              mobile={mobile}
            />
          )}
        >
          {(navigation) => (
            <section
              aria-label="New thread"
              className="flex min-h-0 flex-1 flex-col"
            >
              <PanelHeader
                title="New thread"
                label="Thread"
                navigation={navigation}
              />
              <SocialModuleThread
                variant="ai-chat-create"
                cancelHref={`/ai-chat/projects/${encodeURIComponent(profileId)}`}
              />
            </section>
          )}
        </HostModuleLayout>
      </SocialModuleProfile>
    </HostModuleLayout>
  );
}
