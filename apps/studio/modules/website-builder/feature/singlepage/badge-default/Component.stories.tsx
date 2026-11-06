import { Component as Feature } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultFeatureBadgeDefaultProps } from "./Component";

const meta = {
  id: "modules-website-builder-models-feature-singlepage-badge-default",
  title: "Modules/Website-Builder/Feature/Singlepage/badge-default",
  component: Feature,
  parameters: { layout: "centered" },
  args: { ...defaultFeatureBadgeDefaultProps, variant: "badge-default" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Feature>, { variant: "badge-default" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
