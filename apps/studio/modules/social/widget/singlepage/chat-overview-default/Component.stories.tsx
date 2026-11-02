import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-social-models-widget-singlepage-chat-overview-default",
  title: "Modules/Social/Widget/Singlepage/chat-overview-default",
  component: Widget,
  parameters: {
    layout: "fullscreen",
  },
  args: { variant: "chat-overview-default" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Widget>,
    { variant: "chat-overview-default" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
