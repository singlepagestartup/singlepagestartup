import type { Meta, StoryObj } from "@storybook/react";

import {
  FeatureBadgeDefault,
  defaultFeatureBadgeDefaultProps,
} from "./Component";

const meta = {
  title: "Modules/Website Builder/Models/Feature/Singlepage/badge-default",
  component: FeatureBadgeDefault,
  parameters: { layout: "centered" },
  args: defaultFeatureBadgeDefaultProps,
} satisfies Meta<typeof FeatureBadgeDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
