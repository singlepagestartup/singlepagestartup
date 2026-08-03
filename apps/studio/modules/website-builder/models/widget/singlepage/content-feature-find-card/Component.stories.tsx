import type { Meta, StoryObj } from "@storybook/react";

import {
  ContentFeatureFindCard,
  defaultContentFeatureFindCardProps,
} from "./Component";

const meta = {
  title:
    "Modules/Website Builder/Models/Widget/Singlepage/content-feature-find-card",
  component: ContentFeatureFindCard,
  parameters: {
    layout: "fullscreen",
  },
  args: defaultContentFeatureFindCardProps,
} satisfies Meta<typeof ContentFeatureFindCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
