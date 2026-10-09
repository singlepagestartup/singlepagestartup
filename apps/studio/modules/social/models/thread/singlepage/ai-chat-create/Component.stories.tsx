import { Component } from "./index";
import type { Meta, StoryObj } from "@storybook/react";

function Example() {
  return <Component cancelHref="/ai-chat/projects/pottery" />;
}

const meta = {
  id: "modules-social-models-thread-singlepage-ai-chat-create",
  title: "Modules/Social/Models/Thread/Singlepage/ai-chat-create",
  component: Example,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
