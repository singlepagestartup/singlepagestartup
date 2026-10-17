import { Component as Profile } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultProfileFindRowProps } from "./Component";

const meta = {
  id: "modules-social-models-profile-singlepage-find-row",
  title: "Modules/Social/Profile/Singlepage/find-row",
  component: Profile,
  parameters: {
    layout: "centered",
  },
  args: { ...defaultProfileFindRowProps, variant: "find-row" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Profile>, { variant: "find-row" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
