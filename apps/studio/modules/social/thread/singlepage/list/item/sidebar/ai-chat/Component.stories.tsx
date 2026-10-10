import { Component as SocialModuleThread } from "../../../../../index";

import { useCallback, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../../../../../rbac/subject/singlepage/account/Account";
import { aiChatAccount } from "../../../../../../../../workspace/utils/products/ai-chat-account-fixture";

function Example() {
  const [selected, setSelected] = useState(false);
  const toggleSelected = useCallback(
    () => setSelected((current) => !current),
    [],
  );
  return (
    <div className="max-w-sm rounded-2xl bg-sps-graphite p-4 text-white">
      <SocialModuleThread
        variant="list-item-sidebar-ai-chat"
        id="brief"
        name="Brief.md"
        selected={selected}
        onSelect={toggleSelected}
      />
    </div>
  );
}

const meta = {
  id: "modules-social-models-thread-singlepage-list-item-sidebar-ai-chat",
  title: "Modules/Social/Models/Thread/Singlepage/list/item/sidebar/ai-chat",
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
