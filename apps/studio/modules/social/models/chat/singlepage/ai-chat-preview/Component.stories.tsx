import { Component } from "./index";
import content from "../../../../../website-builder/models/widget/singlepage/ai-chat-landing/content.json";
import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../../../rbac/models/subject/singlepage/ai-chat-settings/Account";
import { aiChatAccount } from "../../../../../../workspace/utils/products/ai-chat-account-fixture";

function Example() {
  return <Component content={content} />;
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
