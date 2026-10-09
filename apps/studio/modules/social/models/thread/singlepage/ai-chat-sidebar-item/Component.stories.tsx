import { Component } from "./index";
import { useCallback, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../../../rbac/models/subject/singlepage/ai-chat-account/Account";
import { aiChatAccount } from "../../../../../../workspace/utils/products/ai-chat-account-fixture";

function Example() {
  const [selected, setSelected] = useState(false);
  const toggleSelected = useCallback(
    () => setSelected((current) => !current),
    [],
  );
  return (
    <div className="max-w-sm rounded-2xl bg-sps-graphite p-4 text-white">
      <Component
        id="brief"
        name="Brief.md"
        selected={selected}
        onSelect={toggleSelected}
      />
    </div>
  );
}

const meta = {
  id: "modules-social-models-thread-singlepage-ai-chat-sidebar-item",
  title: "Modules/Social/Models/Thread/Singlepage/ai-chat-sidebar-item",
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
