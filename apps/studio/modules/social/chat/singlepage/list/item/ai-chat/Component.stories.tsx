import { Component as SocialModuleChat } from "../../../../index";

import type { Meta, StoryObj } from "@storybook/react";

function Example() {
  return (
    <div className="w-64 rounded-xl bg-sps-graphite p-4">
      <SocialModuleChat
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
  title: "Modules/Social/Models/Chat/Singlepage/list/item/ai-chat",
  component: Example,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
