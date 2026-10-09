import { aiChatWorkspaceFixture } from "../../../../../../workspace/utils/products/ai-chat-workspace-fixture";
import { Component as Page } from "./index";
import { aiChatAccount } from "../../../../../../workspace/utils/products/ai-chat-account-fixture";
import type { Meta, StoryObj } from "@storybook/react";

const stayInStory = (_url: string) => {};
function Example() {
  return (
    <Page
      account={aiChatAccount}
      onNavigate={stayInStory}
      workspace={aiChatWorkspaceFixture()}
      url="/ai-chat/projects/pottery"
    />
  );
}

const meta = {
  id: "modules-host-models-page-singlepage-ai-chat-projects-project-id",
  title: "Modules/Host/Models/Page/Singlepage",
  component: Example,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {
  name: "/ai-chat/projects/[project-id]",
};
