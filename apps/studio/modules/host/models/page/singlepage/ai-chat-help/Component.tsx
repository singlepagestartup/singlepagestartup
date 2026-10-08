import { Component as Page } from "./index";
import { aiChatAccount } from "../../../../../../workspace/utils/products/ai-chat-account-fixture";
const stayInStory = (_url: string) => {};
export function Component() {
  return <Page account={aiChatAccount} onNavigate={stayInStory} />;
}
