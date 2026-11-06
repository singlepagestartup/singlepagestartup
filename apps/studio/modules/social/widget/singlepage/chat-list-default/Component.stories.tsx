import { Component as Widget } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-social-models-widget-singlepage-chat-list-default",
  title: "Modules/Social/Widget/Singlepage/chat-list-default",
  component: Widget,
  parameters: {
    layout: "fullscreen",
  },
  args: { variant: "chat-list-default" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Widget>, { variant: "chat-list-default" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
