import { Component as Category } from "../..";
import type { Meta, StoryObj } from "@storybook/react";
import { defaultCategoryButtonDefaultProps } from "./Component";

const meta = {
  id: "modules-blog-models-category-singlepage-button-default",
  title: "Modules/Blog/Category/Singlepage/button-default",
  component: Category,
  parameters: { layout: "centered" },
  args: { ...defaultCategoryButtonDefaultProps, variant: "button-default" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Category>, { variant: "button-default" }>
>;

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
