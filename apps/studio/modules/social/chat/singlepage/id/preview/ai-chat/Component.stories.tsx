import { Component as Chat } from "../../../../index";

import content from "../../../../../../website-builder/widget/singlepage/content/ai-chat/website.json";
import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../../../../rbac/subject/singlepage/me/account/Account";
import { aiChatAccount } from "../../../../../../rbac/subject/singlepage/me/account/fixture";

function Component() {
  return <Chat variant="id-preview-ai-chat" content={content} />;
}

const meta = {
  id: "modules-social-models-chat-singlepage-id-preview-ai-chat",
  title: "Modules/Social/Chat/Singlepage/id/preview/ai-chat",
  component: Component,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <AccountProvider account={aiChatAccount}>
        <Story />
      </AccountProvider>
    ),
  ],
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
