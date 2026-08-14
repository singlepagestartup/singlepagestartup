import type { Meta, StoryObj } from "@storybook/react";

import { FeatureDropdown, defaultFeatureDropdownProps } from "./Component";

const meta = {
  title: "Modules/Website Builder/Models/Feature/Singlepage/dropdown",
  component: FeatureDropdown,
  parameters: {
    layout: "padded",
  },
  args: defaultFeatureDropdownProps,
} satisfies Meta<typeof FeatureDropdown>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};

export const Collapsed: Story = {
  name: "collapsed",
  args: { open: false },
};
