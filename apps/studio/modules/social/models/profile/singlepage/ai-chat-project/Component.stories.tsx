import { Component } from "./index";
import { useState } from "react";
import { aiChatProjectFixture } from "../../../../../../workspace/utils/products/ai-chat-workspace-fixture";
import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../../../rbac/models/subject/singlepage/ai-chat-settings/Account";
import { aiChatAccount } from "../../../../../../workspace/utils/products/ai-chat-account-fixture";

function Example() {
  const [project, setProject] = useState(aiChatProjectFixture);
  return (
    <Component
      project={project}
      active
      onUpdate={(_, update) => setProject(update)}
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
