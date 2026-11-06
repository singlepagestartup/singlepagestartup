import { Component as Profile } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultProfileCompactProps } from "./Component";

const meta = {
  id: "modules-social-models-profile-singlepage-compact",
  title: "Modules/Social/Profile/Singlepage/compact",
  component: Profile,
  parameters: {
    layout: "centered",
  },
  args: { ...defaultProfileCompactProps, variant: "compact" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Profile>, { variant: "compact" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
