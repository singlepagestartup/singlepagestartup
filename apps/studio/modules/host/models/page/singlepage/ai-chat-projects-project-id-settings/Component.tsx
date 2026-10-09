"use client";
import { Component as Layout } from "../../../layout/singlepage/ai-chat/index";
import { Component as ProjectLayout } from "../../../layout/singlepage/ai-chat-project/index";
import { Component as ProjectProfile } from "../../../../../social/models/profile/singlepage/ai-chat-project/index";
import { Component as Sidebar } from "../../../../../social/models/profile/singlepage/ai-chat-sidebar/index";
import { Component as ProjectSelect } from "../../../../../social/models/profile/singlepage/ai-chat-project-select/index";
import { Component as Header } from "../../../../../website-builder/models/widget/singlepage/ai-chat-header/index";
import { Component as ProfileSettings } from "../../../../../social/models/profile/singlepage/ai-chat-settings/index";
import { PanelHeader } from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/ServiceDocument";
export interface IProjectPageProps {
  profileId: string;
}
export function Component({ profileId }: IProjectPageProps) {
  return (
    <Layout>
      <Header
        page="chat"
        projectNavigation={(props) => (
          <ProjectSelect profileId={profileId} {...props} />
        )}
      />
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
