import type { Meta, StoryObj } from "@storybook/react";

import {
  ContentFeatureFindTestimotionals,
  defaultContentFeatureFindTestimotionalsProps,
} from "./Component";

const meta = {
  title:
    "Modules/Website Builder/Models/Widget/Singlepage/content-feature-find-testimotionals",
  component: ContentFeatureFindTestimotionals,
  parameters: {
    layout: "fullscreen",
  },
  args: defaultContentFeatureFindTestimotionalsProps,
} satisfies Meta<typeof ContentFeatureFindTestimotionals>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
