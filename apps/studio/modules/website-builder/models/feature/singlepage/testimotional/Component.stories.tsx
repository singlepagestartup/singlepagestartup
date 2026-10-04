import type { Meta, StoryObj } from "@storybook/react";

import {
  FeatureTestimotional,
  defaultFeatureTestimotionalProps,
} from "./Component";

const meta = {
  title: "Modules/Website Builder/Models/Feature/Singlepage/testimotional",
  component: FeatureTestimotional,
  parameters: {
    layout: "centered",
  },
  args: defaultFeatureTestimotionalProps,
} satisfies Meta<typeof FeatureTestimotional>;

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
