import type { Meta, StoryObj } from "@storybook/react";

import { ContentDefault, defaultContentProps } from "./Component";

const meta = {
  title: "Modules/Website Builder/Models/Widget/Singlepage/content-default",
  component: ContentDefault,
  parameters: {
    layout: "fullscreen",
  },
  args: defaultContentProps,
} satisfies Meta<typeof ContentDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
