import { Component } from "./index";
import type { Meta, StoryObj } from "@storybook/react";

function Example() {
  return (
    <Component
      messages={[
        { id: "welcome", role: "assistant", text: "Who is the workshop for?" },
        {
          id: "audience",
          role: "user",
          text: "Adults trying pottery for the first time.",
        },
      ]}
    />
  );
}

const meta = {
  id: "modules-social-models-thread-singlepage-ai-chat-conversation",
  title: "Modules/Social/Models/Thread/Singlepage/ai-chat-conversation",
  component: Example,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
