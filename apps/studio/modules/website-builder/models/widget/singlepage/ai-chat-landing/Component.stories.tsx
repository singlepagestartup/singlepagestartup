import { Component as WebsiteBuilderModuleWidget } from "../../index";

import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../../../rbac/models/subject/singlepage/ai-chat-account/Account";
import { aiChatAccount } from "../../../../../../workspace/utils/products/ai-chat-account-fixture";

function Example() {
  return <WebsiteBuilderModuleWidget variant="ai-chat-landing" />;
}

const meta = {
  id: "modules-website-builder-models-widget-singlepage-ai-chat-landing",
  title: "Modules/Website-Builder/Models/Widget/Singlepage/ai-chat-landing",
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
