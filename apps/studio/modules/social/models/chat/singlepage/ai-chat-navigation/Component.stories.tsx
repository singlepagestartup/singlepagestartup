import { Component } from "./index";
import type { Meta, StoryObj } from "@storybook/react";

function Example() {
  return (
    <div className="w-64 rounded-xl bg-sps-graphite p-4">
      <Component
        data={{
          id: "work-chat",
          title: "Workshop campaign",
          variant: "ai-chat-work",
        }}
        selected
        onSelect={() => {}}
      />
    </div>
  );
}

const meta = {
  id: "modules-social-models-chat-singlepage-ai-chat-navigation",
  title: "Modules/Social/Models/Chat/Singlepage/ai-chat-navigation",
  component: Example,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
