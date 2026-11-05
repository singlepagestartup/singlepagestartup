import { Component as Message } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-social-models-message-singlepage-bubble-default",
  title: "Modules/Social/Message/Singlepage/bubble-default",
  component: Message,
  parameters: {
    layout: "centered",
  },
  args: { variant: "bubble-default" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Message>, { variant: "bubble-default" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Incoming: Story = {
  name: "incoming",
};

export const Outgoing: Story = {
  name: "outgoing",
  args: {
    author: "Alex Morgan",
    role: "You",
    body: "Confirmed. I will keep the reusable social.message surface separate from RBAC subject orchestration.",
    time: "10:45",
    side: "outgoing",
    attachments: [],
    reactions: ["check"],
  },
};
