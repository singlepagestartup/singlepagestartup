import { aiChatWorkspaceFixture } from "../../../../../../workspace/utils/products/ai-chat-workspace-fixture";
import { Component as Page } from "./index";
import { aiChatAccount } from "../../../../../../workspace/utils/products/ai-chat-account-fixture";
const stayInStory = (_url: string) => {};
export function Component() {
  return (
    <Page
      account={aiChatAccount}
      onNavigate={stayInStory}
      workspace={aiChatWorkspaceFixture()}
      url="/ai-chat/projects/pottery"
    />
  );
}
