import type { Meta, StoryObj } from "@storybook/react";
import {
  CategoryButtonDefault,
  defaultCategoryButtonDefaultProps,
} from "./Component";

const meta = {
  title: "Modules/Blog/Models/Category/Singlepage/button-default",
  component: CategoryButtonDefault,
  parameters: { layout: "centered" },
  args: defaultCategoryButtonDefaultProps,
} satisfies Meta<typeof CategoryButtonDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};

export const Inactive: Story = {
  name: "inactive",
  args: {
    slug: "engineering",
    label: "Engineering",
    count: 2,
    isActive: false,
  },
};
