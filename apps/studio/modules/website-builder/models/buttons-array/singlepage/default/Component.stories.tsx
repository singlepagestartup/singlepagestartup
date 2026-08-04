import type { Meta, StoryObj } from "@storybook/react";

import { ButtonsArrayDefault, defaultButtonsArrayProps } from "./Component";

const meta = {
  title:
    "Modules/Website Builder/Models/Buttons Array/Singlepage/buttons-array-default",
  component: ButtonsArrayDefault,
  parameters: {
    layout: "centered",
  },
  args: defaultButtonsArrayProps,
} satisfies Meta<typeof ButtonsArrayDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
