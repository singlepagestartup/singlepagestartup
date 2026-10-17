import { Component as Tag } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultTagButtonDefaultProps } from "./Component";

const meta = {
  id: "modules-blog-models-tag-singlepage-button-default",
  title: "Modules/Blog/Tag/Singlepage/button-default",
  component: Tag,
  parameters: { layout: "centered" },
  args: { ...defaultTagButtonDefaultProps, variant: "button-default" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Tag>, { variant: "button-default" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
