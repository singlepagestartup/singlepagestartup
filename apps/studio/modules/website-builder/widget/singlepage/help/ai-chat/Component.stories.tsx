import { Component as WebsiteBuilderModuleWidget } from "../../../index";

import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../../../rbac/subject/singlepage/account/Account";
import { aiChatAccount } from "../../../../../../workspace/utils/products/ai-chat-account-fixture";

function Example() {
  return <WebsiteBuilderModuleWidget variant="help-ai-chat" />;
}

const meta = {
  id: "modules-website-builder-models-widget-singlepage-help-ai-chat",
  title: "Modules/Website-Builder/Models/Widget/Singlepage/help/ai-chat",
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
