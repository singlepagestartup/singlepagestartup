import type { Meta, StoryObj } from "@storybook/react";

import { ButtonPrimary, defaultButtonPrimaryProps } from "./Component";

const meta = {
  title: "Modules/Website Builder/Models/Button/Singlepage/primary",
  component: ButtonPrimary,
  parameters: {
    layout: "centered",
  },
  args: defaultButtonPrimaryProps,
} satisfies Meta<typeof ButtonPrimary>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
