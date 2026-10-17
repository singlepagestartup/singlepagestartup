import { Component as Feature } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultFeatureCardProps } from "./Component";

const meta = {
  id: "modules-website-builder-models-feature-singlepage-card",
  title: "Modules/Website-Builder/Feature/Singlepage/card",
  component: Feature,
  parameters: { layout: "centered" },
  args: { ...defaultFeatureCardProps, variant: "card" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Feature>, { variant: "card" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
