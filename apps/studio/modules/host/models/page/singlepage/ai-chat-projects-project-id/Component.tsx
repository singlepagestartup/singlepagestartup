"use client";
import { Component as Layout } from "../../../layout/singlepage/ai-chat/index";
import { Component as ProjectLayout } from "../../../layout/singlepage/ai-chat-project/index";
import { Component as ProjectProfile } from "../../../../../social/models/profile/singlepage/ai-chat-project/index";
import { Component as Sidebar } from "../../../../../social/models/profile/singlepage/ai-chat-sidebar/index";
import { Component as ProjectSelect } from "../../../../../social/models/profile/singlepage/ai-chat-project-select/index";
import { Component as Header } from "../../../../../website-builder/models/widget/singlepage/ai-chat-header/index";
import { Component as ProductsChat } from "../../../../../social/models/chat/singlepage/ai-chat-products/index";
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
