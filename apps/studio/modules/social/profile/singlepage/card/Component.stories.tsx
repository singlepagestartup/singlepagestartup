import { Component as Profile } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultProfileCardProps } from "./Component";

const meta = {
  id: "modules-social-models-profile-singlepage-card",
  title: "Modules/Social/Profile/Singlepage/card",
  component: Profile,
  parameters: {
    layout: "centered",
  },
  args: { ...defaultProfileCardProps, variant: "card" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Profile>, { variant: "card" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
