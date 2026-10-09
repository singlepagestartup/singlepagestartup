import { Component } from "./index";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { AccountProvider } from "../../../../../rbac/models/subject/singlepage/ai-chat-settings/Account";
import { aiChatAccount } from "../../../../../../workspace/utils/products/ai-chat-account-fixture";
function Example() {
  const [data, setData] = useState({
    id: "pottery",
    name: "Pottery workshops",
  });
  return (
    <Component
      data={data}
      active
      onRename={(id, name) => setData({ id, name })}
    />
  );
}

const meta = {
  id: "modules-social-models-profile-singlepage-ai-chat-project",
  title: "Modules/Social/Models/Profile/Singlepage/ai-chat-project",
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
