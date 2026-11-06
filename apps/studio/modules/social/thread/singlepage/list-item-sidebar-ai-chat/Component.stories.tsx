import { Component as Thread } from "../../index";

import { useCallback, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../../rbac/subject/singlepage/me/account/Account";
import { aiChatAccount } from "../../../../rbac/subject/singlepage/me/account/fixture";

function Component() {
  const [selected, setSelected] = useState(false);
  const toggleSelected = useCallback(
    () => setSelected((current) => !current),
    [],
  );
  return (
    <div className="max-w-sm rounded-2xl bg-default p-4 text-default-foreground">
      <Thread
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
  title: "Modules/Social/Thread/Singlepage/list-item-sidebar-ai-chat",
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
