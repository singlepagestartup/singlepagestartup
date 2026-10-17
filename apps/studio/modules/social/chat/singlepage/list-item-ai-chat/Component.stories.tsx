import { Component as Chat } from "../../index";

import type { Meta, StoryObj } from "@storybook/react";

function Component() {
  return (
    <div className="w-64 rounded-xl bg-default p-4">
      <Chat
        variant="list-item-ai-chat"
        data={{
          id: "work-chat",
          title: "Workshop campaign",
          variant: "work-ai-chat",
        }}
        selected
        onSelect={() => {}}
      />
    </div>
  );
}

const meta = {
  id: "modules-social-models-chat-singlepage-list-item-ai-chat",
  title: "Modules/Social/Chat/Singlepage/list-item-ai-chat",
  component: Component,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
