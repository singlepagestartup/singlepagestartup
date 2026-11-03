import { Component as Profile } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultProfileBylineProps } from "./Component";

const meta = {
  id: "modules-social-models-profile-singlepage-byline",
  title: "Modules/Social/Profile/Singlepage/byline",
  component: Profile,
  parameters: {
    layout: "centered",
  },
  args: { ...defaultProfileBylineProps, variant: "byline" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Profile>, { variant: "byline" }>
>;

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
