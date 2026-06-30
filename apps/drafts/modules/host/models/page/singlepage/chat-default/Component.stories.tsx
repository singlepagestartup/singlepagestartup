import type { Meta, StoryObj } from "@storybook/react";

import { ChatDefault } from "./Component";

const meta = {
  id: "modules-host-models-page-singlepage-chat-default",
  title: "Modules/Host/Models/Page/Singlepage",
  component: ChatDefault,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ChatDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "/chat",
};
