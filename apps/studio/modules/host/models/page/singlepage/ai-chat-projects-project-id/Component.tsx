"use client";
import { Component as Layout } from "../../../layout/singlepage/ai-chat-header/index";
import { Component as ProjectLayout } from "../../../layout/singlepage/ai-chat-project/index";
import { Component as ProjectProfile } from "../../../../../social/models/profile/singlepage/ai-chat-project/index";
import { Component as Sidebar } from "../../../../../social/models/profile/singlepage/ai-chat-sidebar/index";
import { Component as ProjectSelect } from "../../../../../social/models/profile/singlepage/ai-chat-project-select/index";
import { Component as ProductsChat } from "../../../../../social/models/chat/singlepage/ai-chat-products/index";
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
              selected="products"
              mobile={mobile}
            />
          )}
        >
          {(navigation) => (
            <ProductsChat profileId={profileId} navigation={navigation} />
          )}
        </ProjectLayout>
      </ProjectProfile>
    </Layout>
  );
}
