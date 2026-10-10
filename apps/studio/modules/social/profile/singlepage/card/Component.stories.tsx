import type { Meta, StoryObj } from "@storybook/react";

import { ProfileCard, defaultProfileCardProps } from "./Component";

const meta = {
  title: "Modules/Social/Models/Profile/Singlepage/card",
  component: ProfileCard,
  parameters: {
    layout: "centered",
  },
  args: defaultProfileCardProps,
} satisfies Meta<typeof ProfileCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
