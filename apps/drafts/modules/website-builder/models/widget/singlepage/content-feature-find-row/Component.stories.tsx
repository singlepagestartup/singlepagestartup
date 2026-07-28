import type { Meta, StoryObj } from "@storybook/react";

import {
  ContentFeatureFindRow,
  defaultContentFeatureFindRowProps,
} from "./Component";

const meta = {
  title:
    "Modules/Website Builder/Models/Widget/Singlepage/content-feature-find-row",
  component: ContentFeatureFindRow,
  parameters: {
    layout: "fullscreen",
  },
  args: defaultContentFeatureFindRowProps,
} satisfies Meta<typeof ContentFeatureFindRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
