import type { Meta, StoryObj } from "@storybook/react";

import { TagFindButton, defaultTagFindButtonProps } from "./Component";

const meta = {
  title: "Modules/Blog/Models/Widget/Singlepage/tag-find-button",
  component: TagFindButton,
  parameters: { layout: "fullscreen" },
  args: defaultTagFindButtonProps,
} satisfies Meta<typeof TagFindButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
