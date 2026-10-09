"use client";
import { Component as Layout } from "../../../layout/singlepage/ai-chat-header/index";
import { Component as ProjectLayout } from "../../../layout/singlepage/ai-chat-project/index";
import { Component as ProjectProfile } from "../../../../../social/models/profile/singlepage/ai-chat-project/index";
import { Component as Sidebar } from "../../../../../social/models/profile/singlepage/ai-chat-sidebar/index";
import { Component as ProjectSelect } from "../../../../../social/models/profile/singlepage/ai-chat-project-select/index";
import { Component as ThreadCreate } from "../../../../../social/models/thread/singlepage/ai-chat-create/index";
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
              <ThreadCreate
                cancelHref={`/ai-chat/projects/${encodeURIComponent(profileId)}`}
              />
            </section>
          )}
        </ProjectLayout>
      </ProjectProfile>
    </Layout>
  );
}
