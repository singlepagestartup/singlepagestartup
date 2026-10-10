import type { Meta, StoryObj } from "@storybook/react";

import { SocialMessageBubbleDefault } from "./Component";

const meta = {
  id: "modules-social-models-message-singlepage-bubble-default",
  title: "Modules/Social/Models/Message/Singlepage/bubble-default",
  component: SocialMessageBubbleDefault,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof SocialMessageBubbleDefault>;

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
