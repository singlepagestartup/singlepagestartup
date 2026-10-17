import { Component as Feature } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultFeatureTestimotionalProps } from "./Component";

const meta = {
  id: "modules-website-builder-models-feature-singlepage-testimotional",
  title: "Modules/Website-Builder/Feature/Singlepage/testimotional",
  component: Feature,
  parameters: {
    layout: "centered",
  },
  args: { ...defaultFeatureTestimotionalProps, variant: "testimotional" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Feature>, { variant: "testimotional" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};

export const PartialRating: Story = {
  name: "partial rating",
  args: { rating: 3 },
};

export const EmptyRating: Story = {
  name: "empty rating",
  args: { rating: 0 },
};

export const InvalidRating: Story = {
  name: "invalid rating",
  args: { rating: Number.NaN },
};
