import { Component as SocialModuleChat } from "../../index";

import content from "../../../../website-builder/widget/singlepage/ai-chat-landing/content.json";
import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../../rbac/subject/singlepage/ai-chat-account/Account";
import { aiChatAccount } from "../../../../../workspace/utils/products/ai-chat-account-fixture";

function Example() {
  return <SocialModuleChat variant="ai-chat-preview" content={content} />;
}

const meta = {
  id: "modules-social-models-chat-singlepage-ai-chat-preview",
  title: "Modules/Social/Models/Chat/Singlepage/ai-chat-preview",
  component: Example,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <AccountProvider account={aiChatAccount}>
        <Story />
      </AccountProvider>
    ),
  ],
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
