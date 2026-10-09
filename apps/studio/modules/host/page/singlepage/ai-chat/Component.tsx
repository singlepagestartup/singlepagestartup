import { Component as HostModuleLayout } from "../../../layout/index";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget/index";

import { Component as SocialModuleChat } from "../../../../social/chat/index";
import { Component as RbacModuleSubject } from "../../../../rbac/subject";
import type { IAIChatWebsiteContent } from "../../../../../workspace/utils/products/ai-chat-content";

export interface IAIChatPageProps {
  content?: IAIChatWebsiteContent;
}
export function Component({ content }: IAIChatPageProps = {}) {
  return (
    <HostModuleLayout
      variant="landing-ai-chat"
      subjectAccount={<RbacModuleSubject variant="account" showTokens />}
      footerContent={content?.footer}
    >
      <main
        id="ai-chat-main"
        data-ds-page="host.page.ai-chat"
        tabIndex={-1}
        className="outline-none"
      >
        <WebsiteBuilderModuleWidget
          variant="content-ai-chat-hero"
          content={content && { hero: content.hero, labels: content.labels }}
        />
        <WebsiteBuilderModuleWidget
          variant="content-ai-chat-try"
          content={
            content && {
              workflow: content.workflow,
              uploadNote: content.labels["demo-upload-note"],
            }
          }
        >
          <SocialModuleChat
            variant="overview-preview-ai-chat"
            content={content}
          />
        </WebsiteBuilderModuleWidget>
        <WebsiteBuilderModuleWidget
          variant="content-ai-chat-continue"
          content={
            content && {
              continue: content.continue,
              terms: content.terms,
              startLink: content.hero.links[0],
            }
          }
        />
      </main>
    </HostModuleLayout>
  );
}
