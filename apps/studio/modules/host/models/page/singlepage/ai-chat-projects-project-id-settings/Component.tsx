"use client";
import { Component as Layout } from "../../../layout/singlepage/ai-chat-header/index";
import { Component as ProjectLayout } from "../../../layout/singlepage/ai-chat-project/index";
import { Component as ProjectProfile } from "../../../../../social/models/profile/singlepage/ai-chat-project/index";
import { Component as Sidebar } from "../../../../../social/models/profile/singlepage/ai-chat-sidebar/index";
import { Component as ProjectSelect } from "../../../../../social/models/profile/singlepage/ai-chat-project-select/index";
import { Component as ProfileSettings } from "../../../../../social/models/profile/singlepage/ai-chat-settings/index";
import { PanelHeader } from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/ServiceDocument";
import { Component as SubjectAccount } from "../../../../../rbac/models/subject/singlepage/ai-chat-account/index";
export interface IProjectPageProps {
  profileId: string;
}
export function Component({ profileId }: IProjectPageProps) {
  return (
    <Layout
      page="chat"
      profileSelect={(props) => (
        <ProjectSelect profileId={profileId} {...props} />
      )}
      subjectAccount={({ onNavigate }) => (
        <SubjectAccount page="chat" onNavigate={onNavigate} />
      )}
    >
      <ProjectProfile profileId={profileId}>
        <ProjectLayout
          sidebar={(mobile) => (
            <Sidebar
              profileId={profileId}
              selected="settings"
              mobile={mobile}
            />
          )}
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
              <ProfileSettings profileId={profileId} />
            </section>
          )}
        </ProjectLayout>
      </ProjectProfile>
    </Layout>
  );
}
