import type { Meta, StoryObj } from "@storybook/react";

import { TagButtonDefault, defaultTagButtonDefaultProps } from "./Component";

const meta = {
  title: "Modules/Blog/Models/Tag/Singlepage/button-default",
  component: TagButtonDefault,
  parameters: { layout: "centered" },
  args: defaultTagButtonDefaultProps,
} satisfies Meta<typeof TagButtonDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
