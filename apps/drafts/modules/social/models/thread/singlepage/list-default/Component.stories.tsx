import type { Meta, StoryObj } from "@storybook/react";

import { SocialThreadListDefault } from "./Component";

const meta = {
  id: "modules-social-models-thread-singlepage-list-default",
  title: "Modules/Social/Models/Thread/Singlepage",
  component: SocialThreadListDefault,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof SocialThreadListDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "list-default",
};
