import type { Meta, StoryObj } from "@storybook/react";

import {
  ContentFeatureFindDefault,
  defaultContentFeatureFindDefaultProps,
} from "./Component";

const meta = {
  title:
    "Modules/Website Builder/Models/Widget/Singlepage/content-feature-find-default",
  component: ContentFeatureFindDefault,
  parameters: {
    layout: "fullscreen",
  },
  args: defaultContentFeatureFindDefaultProps,
} satisfies Meta<typeof ContentFeatureFindDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
