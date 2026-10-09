import { Component as SocialModuleChat } from "../../../../index";

import content from "../../../../../../../workspace/utils/products/ai-chat-website.generated.json";
import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../../../../rbac/subject/singlepage/account/Account";
import { aiChatAccount } from "../../../../../../../workspace/utils/products/ai-chat-account-fixture";

function Example() {
  return (
    <SocialModuleChat variant="overview-preview-ai-chat" content={content} />
  );
}

const meta = {
  id: "modules-social-models-chat-singlepage-overview-preview-ai-chat",
  title: "Modules/Social/Models/Chat/Singlepage/overview/preview/ai-chat",
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
