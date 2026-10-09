import { Component as WebsiteBuilderModuleWidget } from "../../../../../modules/website-builder/widget/index";

import { Component as SocialModuleChat } from "../../../../../modules/social/chat/index";

import sourceText from "./page.md?raw";
import { parseAIChatWebsite } from "./content";
import { AccountProvider } from "../../../../../modules/rbac/subject/singlepage/ai-chat-account/Account";
import { aiChatAccount } from "../../../../utils/products/ai-chat-account-fixture";

export default function Landing({ text }: { text?: string } = {}) {
  return (
    <AccountProvider account={aiChatAccount}>
      <WebsiteBuilderModuleWidget
        variant="ai-chat-landing"
        content={parseAIChatWebsite(text ?? sourceText)}
        chatPreview={(content) => (
          <SocialModuleChat variant="ai-chat-preview" content={content} />
        )}
      />
    </AccountProvider>
  );
}
