import { Component as Page } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-host-models-page-singlepage-social-module-chat-id-thread-id",
  title: "Modules/Host/Page/Singlepage/social-module-chat-id-thread-id",
  component: Page,
  parameters: {
    layout: "fullscreen",
  },
  args: { variant: "social-module-chat-id-thread-id" },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof Page>,
    { variant: "social-module-chat-id-thread-id" }
  >
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Default",
};
