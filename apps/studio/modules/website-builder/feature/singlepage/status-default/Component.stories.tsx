import { Component as Feature } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultFeatureStatusDefaultProps } from "./Component";

const meta = {
  id: "modules-website-builder-models-feature-singlepage-status-default",
  title: "Modules/Website-Builder/Feature/Singlepage/status-default",
  component: Feature,
  parameters: { layout: "centered" },
  args: { ...defaultFeatureStatusDefaultProps, variant: "status-default" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Feature>, { variant: "status-default" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
