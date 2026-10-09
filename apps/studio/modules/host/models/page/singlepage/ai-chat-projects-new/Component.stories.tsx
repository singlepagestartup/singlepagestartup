import { Component as Page } from "./index";
import { aiChatAccount } from "../../../../../../workspace/utils/products/ai-chat-account-fixture";
import type { Meta, StoryObj } from "@storybook/react";

const stayInStory = (_url: string) => {};
function Example() {
  return <Page account={aiChatAccount} onNavigate={stayInStory} />;
}

const meta = {
  id: "modules-host-models-page-singlepage-ai-chat-projects-new",
  title: "Modules/Host/Models/Page/Singlepage",
  component: Example,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = { name: "/ai-chat/projects/new" };
