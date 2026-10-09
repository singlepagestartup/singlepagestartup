import type { Meta, StoryObj } from "@storybook/react";

import { ProfileCompact, defaultProfileCompactProps } from "./Component";

const meta = {
  title: "Modules/Social/Models/Profile/Singlepage/compact",
  component: ProfileCompact,
  parameters: {
    layout: "centered",
  },
  args: defaultProfileCompactProps,
} satisfies Meta<typeof ProfileCompact>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
