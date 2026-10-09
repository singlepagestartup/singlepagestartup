import type { Meta, StoryObj } from "@storybook/react";

import {
  ContentButtonsArrayFindDefault,
  defaultContentButtonsArrayFindDefaultProps,
} from "./Component";

const meta = {
  title:
    "Modules/Website Builder/Models/Widget/Singlepage/content-buttons-array-find-default",
  component: ContentButtonsArrayFindDefault,
  parameters: {
    layout: "fullscreen",
  },
  args: defaultContentButtonsArrayFindDefaultProps,
} satisfies Meta<typeof ContentButtonsArrayFindDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
