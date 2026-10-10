import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  FeatureListItemDefault,
  defaultFeatureListItemDefaultProps,
} from "./Component";

const meta = {
  title: "Modules/Website Builder/Models/Feature/Singlepage/list-item-default",
  component: FeatureListItemDefault,
  parameters: { layout: "centered" },
  args: defaultFeatureListItemDefaultProps,
} satisfies Meta<typeof FeatureListItemDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
