import { aiChatProjectFixture } from "./../../../../../../../../tools/studio/products/fixtures/ai-chat-workspace";
import { Component as Page } from "@sps/host/models/page/frontend/component/src/lib/singlepage/ai-chat-projects-project-id";
import { aiChatAccount } from "./../../../../../../../../tools/studio/products/fixtures/ai-chat-account";
const stayInStory = (_url: string) => {};
export function Component() {
  return (
    <Page
      account={aiChatAccount}
      onNavigate={stayInStory}
      workspace={{ initialProjects: [aiChatProjectFixture()] }}
    />
  );
}
