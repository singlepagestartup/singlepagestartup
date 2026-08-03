import type { Meta, StoryObj } from "@storybook/react";

import {
  ContentFilesFindDefault,
  defaultContentFilesFindDefaultProps,
} from "./Component";

const meta = {
  title:
    "Modules/Website Builder/Models/Widget/Singlepage/content-files-find-default",
  component: ContentFilesFindDefault,
  parameters: {
    layout: "fullscreen",
  },
  args: defaultContentFilesFindDefaultProps,
} satisfies Meta<typeof ContentFilesFindDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
