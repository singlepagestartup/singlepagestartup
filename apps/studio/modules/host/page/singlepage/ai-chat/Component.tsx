import { Component as HostModuleLayout } from "../../../layout/index";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget/index";

import { Component as SocialModuleChat } from "../../../../social/chat/index";

export function Component() {
  return (
    <HostModuleLayout variant="ai-chat">
      <WebsiteBuilderModuleWidget
        variant="ai-chat-landing"
        chatPreview={(content) => (
          <SocialModuleChat variant="ai-chat-preview" content={content} />
        )}
      />
    </HostModuleLayout>
  );
}
