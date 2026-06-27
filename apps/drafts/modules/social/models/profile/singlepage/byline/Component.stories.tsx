import type { Meta, StoryObj } from "@storybook/react";

import { ProfileByline, defaultProfileBylineProps } from "./Component";

const meta = {
  title: "Modules/Social/Models/Profile/Singlepage/byline",
  component: ProfileByline,
  parameters: {
    layout: "centered",
  },
  args: defaultProfileBylineProps,
} satisfies Meta<typeof ProfileByline>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};

export const Small: Story = {
  name: "small",
  args: { size: "sm" },
};

export const ExtraSmall: Story = {
  name: "extra-small",
  args: { size: "xs" },
};
